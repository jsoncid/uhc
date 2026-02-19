import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { ReferralType } from '../../types/referral';

interface Props {
  referral: ReferralType;
  onClose: () => void;
}

const val = (v: string | number | null | undefined) => (v != null && v !== '' ? String(v) : '—');

const dateVal = (d: string | null | undefined) => {
  if (!d) return '—';
  try {
    return format(new Date(d), 'MMMM dd, yyyy');
  } catch {
    return d;
  }
};

const PrintField = ({
  label,
  value,
  full,
}: {
  label: string;
  value?: string | number | null;
  full?: boolean;
}) => (
  <div style={{ gridColumn: full ? '1 / -1' : undefined, marginBottom: 10 }}>
    <div
      style={{
        fontSize: 9,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: '#6b7280',
        marginBottom: 2,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 11,
        color: '#111827',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: 3,
      }}
    >
      {val(value)}
    </div>
  </div>
);

const SectionHeader = ({ title }: { title: string }) => (
  <div
    style={{
      background: '#1e3a5f',
      color: '#ffffff',
      fontSize: 10,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      padding: '5px 10px',
      marginTop: 14,
      marginBottom: 8,
    }}
  >
    {title}
  </div>
);

const Grid = ({ columns = 3, children }: { columns?: number; children: React.ReactNode }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '0 20px',
      padding: '0 10px',
    }}
  >
    {children}
  </div>
);

const ReferralPrintDocument = ({ referral, onClose }: Props) => {
  const info = referral.referral_info;
  const history = referral.history ?? [];

  useEffect(() => {
    const handleAfterPrint = () => {
      onClose();
    };
    window.addEventListener('afterprint', handleAfterPrint);
    const timer = setTimeout(() => {
      window.print();
    }, 200);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [onClose]);

  const hasObGyne =
    info &&
    (info.gravida ||
      info.lmp ||
      info.ie ||
      info.ultrasound_latest_date ||
      info.comorbidity ||
      info.lab_result);

  const diagnostics = info?.diagnostics?.filter((d) => d.status) ?? [];
  const vaccinations = info?.vaccinations?.filter((v) => v.status) ?? [];

  const printStyles = `
    @media print {
      @page {
        size: 8.5in 14in portrait;
        margin: 12mm 14mm 18mm 14mm;
      }
      body > *:not(#referral-print-portal) {
        display: none !important;
        visibility: hidden !important;
      }
      #referral-print-portal {
        display: block !important;
        visibility: visible !important;
        position: static !important;
      }
      #referral-print-portal * {
        visibility: visible !important;
      }
    }
    @media screen {
      #referral-print-portal {
        display: none !important;
      }
    }
  `;

  const content = (
    <div id="referral-print-portal">
      <style>{printStyles}</style>
      <div
        style={{
          fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
          fontSize: 11,
          color: '#111827',
          width: '8.5in',
          margin: '0 auto',
          background: '#fff',
        }}
      >
        {/* ── LETTERHEAD ── */}
        <div style={{ borderBottom: '3px solid #1e3a5f', paddingBottom: 12, marginBottom: 4 }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div>
              <div
                style={{ fontSize: 16, fontWeight: 800, color: '#1e3a5f', letterSpacing: '0.02em' }}
              >
                Universal Health Care
              </div>
              <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>
                Referral Management System
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#1e3a5f',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Referral Document
              </div>
              <div style={{ fontSize: 10, color: '#6b7280', marginTop: 3 }}>
                Ref No: <strong style={{ color: '#111827' }}>{referral.id}</strong>
              </div>
              <div style={{ fontSize: 10, color: '#6b7280' }}>
                Date: <strong style={{ color: '#111827' }}>{dateVal(referral.created_at)}</strong>
              </div>
              <div style={{ fontSize: 10, color: '#6b7280' }}>
                Status:{' '}
                <strong style={{ color: '#111827' }}>
                  {referral.latest_status?.description ?? 'No Status'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* ── PATIENT INFORMATION ── */}
        <SectionHeader title="Patient Information" />
        <Grid columns={3}>
          <PrintField label="Patient Name" value={referral.patient_name} />
          <PrintField label="Patient ID" value={referral.patient_profile} />
          <PrintField label="Date of Referral" value={dateVal(referral.created_at)} />
          <PrintField label="Referring Facility" value={referral.from_assignment_name} />
          <PrintField label="Referred To" value={referral.to_assignment_name} />
          <PrintField label="Current Status" value={referral.latest_status?.description} />
        </Grid>

        {/* ── REFERRAL INFORMATION ── */}
        <SectionHeader title="Referral Information" />
        <Grid columns={3}>
          <PrintField label="Referring Physician" value={info?.referring_doctor} />
          <PrintField label="Contact Number" value={info?.contact_no} />
          <PrintField label="Date Created" value={dateVal(referral.created_at)} />
          <div style={{ gridColumn: '1 / -1', marginBottom: 10, padding: '0' }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#6b7280',
                marginBottom: 2,
              }}
            >
              Reason for Referral
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#111827',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: 3,
                minHeight: 18,
              }}
            >
              {val(info?.reason_referral)}
            </div>
          </div>
        </Grid>

        {/* ── VITAL SIGNS ── */}
        <SectionHeader title="Vital Signs" />
        <Grid columns={4}>
          <PrintField label="Blood Pressure" value={info?.blood_pressure} />
          <PrintField label="Temperature (°C)" value={info?.temperature} />
          <PrintField label="Heart Rate" value={info?.heart_rate} />
          <PrintField label="Respiratory Rate" value={info?.respiratory_rate} />
          <PrintField label="O2 Saturation" value={info?.o2_sat} />
          <PrintField label="O2 Requirement" value={info?.o2_requirement} />
          <PrintField label="GCS" value={info?.gcs} />
          <PrintField label="Motor" value={info?.motor} />
        </Grid>

        {/* ── CLINICAL NOTES ── */}
        <SectionHeader title="Clinical Notes" />
        <div style={{ padding: '0 10px' }}>
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#6b7280',
                marginBottom: 3,
              }}
            >
              Chief Complaints
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#111827',
                border: '1px solid #e5e7eb',
                padding: '6px 8px',
                minHeight: 32,
                borderRadius: 2,
                lineHeight: 1.5,
              }}
            >
              {val(info?.chief_complaints)}
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0 20px',
              marginBottom: 4,
            }}
          >
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#6b7280',
                  marginBottom: 3,
                }}
              >
                History of Present Illness
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#111827',
                  border: '1px solid #e5e7eb',
                  padding: '6px 8px',
                  minHeight: 40,
                  borderRadius: 2,
                  lineHeight: 1.5,
                }}
              >
                {val(info?.history_present_illness)}
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#6b7280',
                  marginBottom: 3,
                }}
              >
                Physical Examination
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#111827',
                  border: '1px solid #e5e7eb',
                  padding: '6px 8px',
                  minHeight: 40,
                  borderRadius: 2,
                  lineHeight: 1.5,
                }}
              >
                {val(info?.pe)}
              </div>
            </div>
          </div>
        </div>

        {/* ── MEDICATIONS ── */}
        <SectionHeader title="Medications" />
        <div style={{ padding: '0 10px', marginBottom: 4 }}>
          <div
            style={{
              fontSize: 11,
              color: '#111827',
              border: '1px solid #e5e7eb',
              padding: '6px 8px',
              minHeight: 32,
              borderRadius: 2,
              lineHeight: 1.5,
            }}
          >
            {val(info?.medications)}
          </div>
        </div>

        {/* ── OB/GYNE SECTION ── */}
        {hasObGyne && (
          <>
            <SectionHeader title="OB / GYNE — Obstetric History" />
            <Grid columns={4}>
              <PrintField label="Gravida" value={info?.gravida} />
              <PrintField label="Parity (TPAL)" value={info?.parity} />
              <PrintField label="Menarche" value={info?.menarche} />
              <PrintField label="LMP" value={dateVal(info?.lmp)} />
              <PrintField label="AOG" value={info?.aog} />
              <PrintField label="EDC" value={dateVal(info?.edc)} />
              <PrintField label="Fundal Height (FH)" value={info?.fh} />
              <PrintField label="Fetal Heart Tone (FHT)" value={info?.fht} />
            </Grid>

            <SectionHeader title="OB / GYNE — IE Findings" />
            <Grid columns={4}>
              <PrintField label="Internal Examination" value={info?.ie} />
              <PrintField label="Dilatation" value={info?.dilatation} />
              <PrintField label="Effacement" value={info?.effacement} />
              <PrintField label="Station" value={info?.station} />
              <PrintField label="Presenting Part" value={info?.presenting_part} />
              {info?.prom_hours && <PrintField label="PROM (Hours)" value={info?.prom_hours} />}
            </Grid>

            <SectionHeader title="OB / GYNE — Ultrasound" />
            <Grid columns={4}>
              {(info?.ultrasound_1st_date || info?.ultrasound_1st_aog) && (
                <>
                  <PrintField label="1st US — Date" value={dateVal(info?.ultrasound_1st_date)} />
                  <PrintField label="1st US — AOG" value={info?.ultrasound_1st_aog} />
                  <div />
                  <div />
                </>
              )}
              <PrintField label="Latest US — Date" value={dateVal(info?.ultrasound_latest_date)} />
              <PrintField label="EFW" value={info?.ultrasound_efw} />
              <PrintField label="Presentation" value={info?.ultrasound_presentation} />
              <PrintField label="Impression" value={info?.ultrasound_impression} />
            </Grid>

            <SectionHeader title="OB / GYNE — Comorbidities & Diagnostics" />
            <Grid columns={2}>
              <PrintField label="Comorbidity" value={info?.comorbidity} />
              <PrintField label="Previous Surgeries" value={info?.previous_surgeries} />
              <PrintField
                label="Previous CS (When / Where / Indication)"
                value={info?.previous_cs}
              />
              <PrintField label="Lab Result" value={info?.lab_result} />
              <PrintField label="X-Ray" value={info?.xray} />
              <PrintField label="Other Diagnostics" value={info?.other_diagnostics} />
            </Grid>
          </>
        )}

        {/* ── COVID-19 ── */}
        <SectionHeader title="COVID-19 Information" />
        <Grid columns={4}>
          <PrintField label="RT-PCR Result" value={info?.rtpcr} />
          <PrintField label="RT-PCR Date" value={dateVal(info?.rtpcr_date)} />
          <PrintField label="Antigen Result" value={info?.antigen} />
          <PrintField label="Antigen Date" value={dateVal(info?.antigen_date)} />
          <PrintField label="COVID-19 Exposure" value={info?.exposure_covid} />
        </Grid>

        {/* ── DIAGNOSTICS ── */}
        {diagnostics.length > 0 && (
          <>
            <SectionHeader title="Ordered Diagnostics" />
            <div style={{ padding: '0 10px', marginBottom: 4 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '4px 8px',
                        border: '1px solid #e5e7eb',
                        fontWeight: 700,
                      }}
                    >
                      Diagnostic
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '4px 8px',
                        border: '1px solid #e5e7eb',
                        fontWeight: 700,
                        width: 100,
                      }}
                    >
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {diagnostics.map((d, i) => (
                    <tr key={d.id ?? i}>
                      <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb' }}>
                        {d.diagnostics}
                      </td>
                      <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb' }}>
                        {dateVal(d.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── VACCINATIONS ── */}
        {vaccinations.length > 0 && (
          <>
            <SectionHeader title="Vaccination History" />
            <div style={{ padding: '0 10px', marginBottom: 4 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '4px 8px',
                        border: '1px solid #e5e7eb',
                        fontWeight: 700,
                      }}
                    >
                      Vaccine
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '4px 8px',
                        border: '1px solid #e5e7eb',
                        fontWeight: 700,
                        width: 100,
                      }}
                    >
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vaccinations.map((v, i) => (
                    <tr key={v.id ?? i}>
                      <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb' }}>
                        {v.description}
                      </td>
                      <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb' }}>
                        {dateVal(v.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── REFERRAL HISTORY ── */}
        {history.length > 0 && (
          <>
            <SectionHeader title="Referral History" />
            <div style={{ padding: '0 10px', marginBottom: 4 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '4px 8px',
                        border: '1px solid #e5e7eb',
                        fontWeight: 700,
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '4px 8px',
                        border: '1px solid #e5e7eb',
                        fontWeight: 700,
                      }}
                    >
                      Facility
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '4px 8px',
                        border: '1px solid #e5e7eb',
                        fontWeight: 700,
                      }}
                    >
                      Details
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '4px 8px',
                        border: '1px solid #e5e7eb',
                        fontWeight: 700,
                        width: 110,
                      }}
                    >
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={h.id ?? i}>
                      <td
                        style={{
                          padding: '4px 8px',
                          border: '1px solid #e5e7eb',
                          fontWeight: h.is_active ? 700 : 400,
                        }}
                      >
                        {h.status_description ?? '—'}
                      </td>
                      <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb' }}>
                        {h.to_assignment_name ?? '—'}
                      </td>
                      <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb' }}>
                        {h.details ?? '—'}
                      </td>
                      <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb' }}>
                        {(() => {
                          try {
                            return format(new Date(h.created_at), 'MMM dd, yyyy');
                          } catch {
                            return '—';
                          }
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── SIGNATURE BLOCK ── */}
        <div
          style={{
            marginTop: 28,
            borderTop: '2px solid #1e3a5f',
            paddingTop: 16,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '0 30px',
            padding: '16px 10px 0',
          }}
        >
          <div>
            <div
              style={{
                borderTop: '1px solid #374151',
                paddingTop: 6,
                marginTop: 28,
                fontSize: 10,
                textAlign: 'center',
                color: '#374151',
              }}
            >
              <strong>Attending Physician / Referring Doctor</strong>
              <br />
              <span style={{ color: '#6b7280' }}>Signature over Printed Name</span>
            </div>
          </div>
          <div>
            <div
              style={{
                borderTop: '1px solid #374151',
                paddingTop: 6,
                marginTop: 28,
                fontSize: 10,
                textAlign: 'center',
                color: '#374151',
              }}
            >
              <strong>Receiving Physician / Accepting Doctor</strong>
              <br />
              <span style={{ color: '#6b7280' }}>Signature over Printed Name</span>
            </div>
          </div>
          <div>
            <div
              style={{
                borderTop: '1px solid #374151',
                paddingTop: 6,
                marginTop: 28,
                fontSize: 10,
                textAlign: 'center',
                color: '#374151',
              }}
            >
              <strong>Authorized Representative</strong>
              <br />
              <span style={{ color: '#6b7280' }}>Signature over Printed Name / Date</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 14,
            borderTop: '1px solid #e5e7eb',
            paddingTop: 6,
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 8,
            color: '#9ca3af',
          }}
        >
          <span>Agusan Del Norte Provincial Hospital</span>
          <span>
            Ref No: {referral.id} | Printed: {format(new Date(), 'MMMM dd, yyyy · h:mm a')}
          </span>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default ReferralPrintDocument;
