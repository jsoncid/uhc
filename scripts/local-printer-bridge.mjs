import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const host = process.env.PRINTER_BRIDGE_HOST || '127.0.0.1';
const port = Number(process.env.PRINTER_BRIDGE_PORT || 4679);
const DUPLICATE_PRINT_WINDOW_MS = 1500;
const TICKET_WIDTH_MM = 84.5;
const TICKET_HEIGHT_MM = 108;

const mmToHundredthsInch = (mm) => Math.round((mm / 25.4) * 100);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Access-Control-Request-Private-Network',
  'Access-Control-Allow-Private-Network': 'true',
  'Access-Control-Max-Age': '600',
  Vary: 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers, Access-Control-Request-Private-Network',
};

let lastPrintSignature = '';
let lastPrintAt = 0;

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    ...CORS_HEADERS,
  });
  res.end(JSON.stringify(payload));
};

const sendNoContent = (res, statusCode = 204) => {
  res.writeHead(statusCode, {
    ...CORS_HEADERS,
  });
  res.end();
};

const readJsonBody = async (req) => {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return {};
  }

  return JSON.parse(raw);
};

const listWindowsPrinters = async () => {
  if (process.platform !== 'win32') {
    return [];
  }

  const psCommand = [
    '$printers = Get-Printer | Select-Object -Property Name,DriverName,PortName,Default',
    ';',
    '$result = $printers | ForEach-Object {',
    '$paper = $null',
    ';',
    '$paperSizes = @()',
    ';',
    'try {',
    '$config = Get-PrintConfiguration -PrinterName $_.Name -ErrorAction Stop',
    ';',
    'if ($config -and $config.PaperSize) { $paper = [string]$config.PaperSize }',
    ';',
    'if ($config -and $config.PrintCapabilitiesXML) {',
    'try {',
    '[xml]$capXml = $config.PrintCapabilitiesXML',
    ';',
    '$ns = New-Object System.Xml.XmlNamespaceManager($capXml.NameTable)',
    ';',
    "$ns.AddNamespace('psf', 'http://schemas.microsoft.com/windows/2003/08/printing/printschemaframework')",
    ';',
    "$nodes = $capXml.SelectNodes(\"//psf:Feature[@name='psk:PageMediaSize']/psf:Option/psf:Property[@name='psk:DisplayName']/psf:Value\", $ns)",
    ';',
    'if ($nodes) {',
    '$paperSizes = $nodes',
    '|',
    'ForEach-Object { [string]$_.InnerText }',
    '|',
    'Where-Object { $_ -and $_.Trim().Length -gt 0 }',
    '|',
    'Select-Object -Unique',
    '}',
    '} catch {}',
    '}',
    '} catch {}',
    ';',
    '[PSCustomObject]@{',
    'Name = $_.Name',
    ';',
    'DriverName = $_.DriverName',
    ';',
    'PortName = $_.PortName',
    ';',
    'Default = $_.Default',
    ';',
    'PaperSize = $paper',
    ';',
    'PaperSizes = @($paperSizes)',
    '}',
    '}',
    ';',
    '$result',
    '|',
    'ConvertTo-Json',
    '-Depth',
    '6',
  ].join(' ');

  const { stdout } = await execFileAsync(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCommand],
    {
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  const content = stdout.trim();
  if (!content) {
    return [];
  }

  const raw = JSON.parse(content);
  const items = Array.isArray(raw) ? raw : [raw];

  return items
    .map((printer) => {
      const name = typeof printer?.Name === 'string' ? printer.Name.trim() : '';
      if (!name) return null;

      return {
        name,
        description: typeof printer?.DriverName === 'string' ? printer.DriverName : undefined,
        paperSize: typeof printer?.PaperSize === 'string' ? printer.PaperSize : undefined,
        paperSizes: Array.isArray(printer?.PaperSizes)
          ? printer.PaperSizes
            .filter((paperSize) => typeof paperSize === 'string')
            .map((paperSize) => paperSize.trim())
            .filter(Boolean)
          : undefined,
        isDefault: Boolean(printer?.Default),
        port: typeof printer?.PortName === 'string' ? printer.PortName : undefined,
      };
    })
    .filter(Boolean);
};

// Ticket formatting constants
const TICKET_WIDTH_CHARS = 40;
const TICKET_LINES = [
  { text: '========================================', style: 'normal' },
  { text: '          Q U E U E   T I C K E T', style: 'bold' },
  { text: '========================================', style: 'normal' },
  { text: '', style: 'normal' },
  { text: '', style: 'normal' },
  { text: '          [QUEUE_CODE_PLACEHOLDER]', style: 'code' },
  { text: '', style: 'normal' },
  { text: '', style: 'normal' },
  { text: '          [PRIORITY_PLACEHOLDER]', style: 'normal' },
  { text: '', style: 'normal' },
  { text: '          [GENERATED_AT_PLACEHOLDER]', style: 'small' },
  { text: '', style: 'normal' },
  { text: '----------------------------------------', style: 'normal' },
  { text: '  Generated by UHC Queue System', style: 'small' },
  { text: '========================================', style: 'normal' },
];

const formatLine = (line, context) => {
  let text = line.text;
  text = text.replace('[QUEUE_CODE_PLACEHOLDER]', context.queueCode || '------');
  text = text.replace('[PRIORITY_PLACEHOLDER]', (context.priority || 'REGULAR').toUpperCase());
  text = text.replace('[GENERATED_AT_PLACEHOLDER]', context.generatedAt || '');
  // Center text within ticket width
  const padding = Math.max(0, Math.floor((TICKET_WIDTH_CHARS - text.length) / 2));
  return ' '.repeat(padding) + text;
};

const generateTicketText = (payload) => {
  const ctx = {
    queueCode: payload.queueCode || '------',
    priority: payload.priority || 'Regular',
    generatedAt: payload.generatedAt || '',
    isSpecial: Boolean(payload.isSpecial),
  };
  return TICKET_LINES.map((line) => formatLine(line, ctx)).join('\n');
};

const autoPrintQueueTicket = async (payload) => {
  if (process.platform !== 'win32') {
    throw new Error('Automatic printing is supported only on Windows.');
  }

  const normalizedPayload = {
    queueCode: typeof payload?.queueCode === 'string' ? payload.queueCode : '',
    priority: typeof payload?.priority === 'string' ? payload.priority : 'Regular',
    generatedAt: typeof payload?.generatedAt === 'string' ? payload.generatedAt : '',
    isSpecial: Boolean(payload?.isSpecial),
    printerName: typeof payload?.printerName === 'string' ? payload.printerName : '',
    paperSize: typeof payload?.paperSize === 'string' ? payload.paperSize : '',
  };

  if (!normalizedPayload.queueCode) {
    throw new Error('queueCode is required.');
  }

  const encodedPayload = Buffer
    .from(JSON.stringify(normalizedPayload), 'utf8')
    .toString('base64');

  const ticketWidthHi = mmToHundredthsInch(TICKET_WIDTH_MM);
  const ticketHeightHi = mmToHundredthsInch(TICKET_HEIGHT_MM);

  const psCommand = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$json = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${encodedPayload}'))
$payload = $json | ConvertFrom-Json
$queueCode = [string]$payload.queueCode
$priority = [string]$payload.priority
$generatedAt = [string]$payload.generatedAt
$isSpecial = [bool]$payload.isSpecial
$printerName = [string]$payload.printerName
$paperSize = [string]$payload.paperSize
$richPrinted = $false
$ticketWidthHi = ${ticketWidthHi}
$ticketHeightHi = ${ticketHeightHi}

$doc = New-Object System.Drawing.Printing.PrintDocument
if ($printerName) { $doc.PrinterSettings.PrinterName = $printerName }

if ($doc.PrinterSettings.IsValid) {
  # Enforce ticket output size to exactly 84.5mm x 108mm.
  $ticketPaper = New-Object System.Drawing.Printing.PaperSize('UHC-Ticket-84.5x108', $ticketWidthHi, $ticketHeightHi)
  $doc.DefaultPageSettings.PaperSize = $ticketPaper

  $doc.DefaultPageSettings.Landscape = $false
  $doc.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0, 0, 0, 0)
  $doc.PrintController = New-Object System.Drawing.Printing.StandardPrintController

  $onPrint = {
    param($sender, $e)
    $g = $e.Graphics
    $bounds = $e.PageBounds
    $contentPaddingX = 14
    $contentLeft = $bounds.Left + $contentPaddingX
    $contentRight = $bounds.Right - $contentPaddingX
    $contentWidth = $contentRight - $contentLeft
    $centerX = $contentLeft + ($contentWidth / 2)
    $contentTop = $bounds.Top + 10
    $contentHeight = $bounds.Height - 20

    # Match dialog ticket card typography/spacing
    $titleFont = New-Object System.Drawing.Font('Consolas', 13, [System.Drawing.FontStyle]::Bold)
    $codeFont = New-Object System.Drawing.Font('Consolas', 68, [System.Drawing.FontStyle]::Bold)
    $metaFont = New-Object System.Drawing.Font('Consolas', 10, [System.Drawing.FontStyle]::Regular)
    $badgeFont = New-Object System.Drawing.Font('Consolas', 12, [System.Drawing.FontStyle]::Bold)

    $sfCenter = New-Object System.Drawing.StringFormat
    $sfCenter.Alignment = [System.Drawing.StringAlignment]::Center
    $sfCenter.LineAlignment = [System.Drawing.StringAlignment]::Near

    $linePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(209,213,219))
    $linePen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash

    $codeColor = if ($isSpecial) { [System.Drawing.Color]::FromArgb(220,38,38) } else { [System.Drawing.Color]::FromArgb(22,163,74) }
    $codeBrush = New-Object System.Drawing.SolidBrush($codeColor)

    $badgeBgColor = if ($isSpecial) { [System.Drawing.Color]::FromArgb(254,226,226) } else { [System.Drawing.Color]::FromArgb(220,252,231) }
    $badgeTextColor = if ($isSpecial) { [System.Drawing.Color]::FromArgb(185,28,28) } else { [System.Drawing.Color]::FromArgb(21,128,61) }
    $badgeBgBrush = New-Object System.Drawing.SolidBrush($badgeBgColor)
    $badgeTextBrush = New-Object System.Drawing.SolidBrush($badgeTextColor)

    $titleY = [float]$contentTop
    $lineY = [int]($contentTop + 24)
    $codeY = [float]($contentTop + ($contentHeight * 0.26))
    $badgeY = [float]($contentTop + ($contentHeight * 0.63))
    $dateY = [float]($contentTop + ($contentHeight * 0.83))

    $g.DrawString('Queue Ticket', $titleFont, [System.Drawing.Brushes]::Black, [float]$centerX, $titleY, $sfCenter)
    $g.DrawLine($linePen, $contentLeft, $lineY, $contentRight, $lineY)
    $g.DrawString($queueCode, $codeFont, $codeBrush, [float]$centerX, $codeY, $sfCenter)

    $badgeText = if ($priority) { $priority.ToUpper() } else { 'REGULAR' }
    $badgeSize = $g.MeasureString($badgeText, $badgeFont)
    $badgePaddingX = 10
    $badgePaddingY = 3
    $badgeWidth = [int]([Math]::Ceiling($badgeSize.Width)) + ($badgePaddingX * 2)
    $badgeHeight = [int]([Math]::Ceiling($badgeSize.Height)) + ($badgePaddingY * 2)
    $badgeLeft = [int]($centerX - ($badgeWidth / 2))
    $badgeTop = [int]$badgeY
    $badgeRect = New-Object System.Drawing.Rectangle($badgeLeft, $badgeTop, $badgeWidth, $badgeHeight)
    $g.FillRectangle($badgeBgBrush, $badgeRect)
    $g.DrawString($badgeText, $badgeFont, $badgeTextBrush, [float]$centerX, [float]($badgeTop + $badgePaddingY), $sfCenter)

    $g.DrawString($generatedAt, $metaFont, [System.Drawing.Brushes]::DimGray, [float]$centerX, $dateY, $sfCenter)

    $linePen.Dispose()
    $codeBrush.Dispose()
    $badgeBgBrush.Dispose()
    $badgeTextBrush.Dispose()
    $titleFont.Dispose()
    $codeFont.Dispose()
    $metaFont.Dispose()
    $badgeFont.Dispose()
    $sfCenter.Dispose()

    $e.HasMorePages = $false
  }

  $doc.add_PrintPage($onPrint)
  try {
    $doc.Print()
    $richPrinted = $true
  } finally {
    $doc.remove_PrintPage($onPrint)
    $doc.Dispose()
  }
}

if (-not $richPrinted) {
  $fallbackText = @('========================================','          Q U E U E   T I C K E T','========================================','','          ' + $queueCode,'','          ' + $priority.ToUpper(),'','          ' + $generatedAt,'','----------------------------------------','  Generated by UHC Queue System') -join [Environment]::NewLine
  if ($printerName -and $paperSize -and $paperSize -ne 'Unknown') {
    try { Set-PrintConfiguration -PrinterName $printerName -PaperSize $paperSize -ErrorAction Stop } catch {}
  }
  if ($printerName) { $fallbackText | Out-Printer -Name $printerName } else { $fallbackText | Out-Printer }
}
`;

  await execFileAsync(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCommand],
    {
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024,
    },
  );
};

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 400, { error: 'Invalid request URL' });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    sendNoContent(res);
    return;
  }

  if (req.method === 'GET' && pathname === '/health') {
    sendJson(res, 200, { ok: true, platform: process.platform });
    return;
  }

  if (req.method === 'GET' && pathname === '/printers') {
    try {
      const printers = await listWindowsPrinters();
      sendJson(res, 200, { printers });
      return;
    } catch (error) {
      sendJson(res, 500, {
        error: 'Failed to list printers',
        message: error instanceof Error ? error.message : String(error),
      });
      return;
    }
  }

  if (req.method === 'POST' && pathname === '/print-ticket') {
    try {
      const payload = await readJsonBody(req);

      const signature = JSON.stringify({
        queueCode: typeof payload?.queueCode === 'string' ? payload.queueCode : '',
        priority: typeof payload?.priority === 'string' ? payload.priority : '',
        generatedAt: typeof payload?.generatedAt === 'string' ? payload.generatedAt : '',
        printerName: typeof payload?.printerName === 'string' ? payload.printerName : '',
        paperSize: typeof payload?.paperSize === 'string' ? payload.paperSize : '',
      });

      const now = Date.now();
      if (
        signature === lastPrintSignature
        && now - lastPrintAt <= DUPLICATE_PRINT_WINDOW_MS
      ) {
        sendJson(res, 200, { ok: true, duplicateIgnored: true });
        return;
      }

      lastPrintSignature = signature;
      lastPrintAt = now;

      await autoPrintQueueTicket(payload);
      sendJson(res, 200, { ok: true });
      return;
    } catch (error) {
      sendJson(res, 500, {
        error: 'Failed to print ticket',
        message: error instanceof Error ? error.message : String(error),
      });
      return;
    }
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(port, host, () => {
  process.stdout.write(`Printer bridge listening on http://${host}:${port}\n`);
});
