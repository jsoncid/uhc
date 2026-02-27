import { useState, useEffect, useRef, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import {
  PenTool,
  Plus,
  Loader2,
  FileText,
  Clock,
  Trash2,
} from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';
import { useAuthStore } from '../../../../../stores/useAuthStore';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ScribbleNote {
  id: string;
  user_id: string;
  input_uuid: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BCrumb = [
  { to: '/', title: 'Home' },
  { title: 'Module 5' },
  { title: 'Note App' },
];

// Deep link configuration for mobile app
// Uses the custom scheme registered in the standalone APK's AndroidManifest.xml
const MOBILE_APP_DEEP_LINK = 'noteapp://canvas';
const WEB_FALLBACK_URL = 'https://your-mobile-app-web.com/write'; // Fallback if app is not installed

/*
 * ── Mobile-side save guidance ──────────────────────────────────────────
 * The mobile app (React Native / Expo) MUST save plain text, NOT JSON.
 *
 * ✅ CORRECT – save plain text directly:
 *    await supabase
 *      .schema('module5')
 *      .from('scribble_text')
 *      .update({ content: plainTextString })
 *      .eq('input_uuid', noteId);
 *
 * ❌ WRONG – do NOT stringify:
 *    .update({ content: JSON.stringify(plainTextString) })
 *    .update({ content: JSON.stringify({ text: plainTextString }) })
 * ────────────────────────────────────────────────────────────────────── */

/**
 * Safely extracts plain text from `content`.
 *
 * Handles three cases the mobile app might produce:
 *  1. Already plain text → returned as-is
 *  2. JSON-stringified string (e.g. `"hello\nworld"`) → unwrapped once
 *  3. JSON object with a `text` / `content` key → that value is extracted
 *
 * This makes the web UI resilient regardless of how the mobile app saves.
 */
function normalizeContent(raw: string | null | undefined): string {
  if (!raw) return '';

  const trimmed = raw.trim();

  // Quick exit: if it doesn't start with " or { or [ it's definitely plain text
  if (trimmed[0] !== '"' && trimmed[0] !== '{' && trimmed[0] !== '[') {
    return trimmed;
  }

  try {
    const parsed = JSON.parse(trimmed);

    // Case: JSON-stringified string  →  '"Hello\nWorld"'
    if (typeof parsed === 'string') {
      return parsed;
    }

    if (typeof parsed === 'object' && parsed !== null) {
      // Case: { blocks: [ { content: "..." }, ... ] }  ← mobile block-based format
      if (Array.isArray(parsed.blocks)) {
        return parsed.blocks
          .filter((b: unknown) => typeof (b as Record<string, unknown>).content === 'string')
          .map((b: unknown) => ((b as Record<string, unknown>).content as string).trim())
          .join('\n');
      }

      // Case: plain array at root  →  [ { content: "..." }, ... ]
      if (Array.isArray(parsed)) {
        const first = parsed[0];
        if (first && typeof first.content === 'string') {
          return parsed
            .filter((b: unknown) => typeof (b as Record<string, unknown>).content === 'string')
            .map((b: unknown) => ((b as Record<string, unknown>).content as string).trim())
            .join('\n');
        }
      }

      // Case: JSON object like { text: "..." } or { content: "..." }
      const candidate = parsed.text ?? parsed.content ?? parsed.body ?? null;
      if (typeof candidate === 'string') {
        return candidate;
      }

      // Unknown shape – fall back to raw
      return trimmed;
    }

    // Anything else (number, boolean) – show raw
    return trimmed;
  } catch {
    // Not valid JSON – plain text that happens to start with " or {
    return trimmed;
  }
}

/** Returns each block's content as a separate string for paragraph rendering. */
function extractBlocks(raw: string | null | undefined): string[] {
  if (!raw) return [];

  const trimmed = raw.trim();

  if (trimmed[0] !== '{' && trimmed[0] !== '[') {
    // Plain text – split on newlines so line breaks become separate paragraphs
    return trimmed.split('\n').filter(Boolean);
  }

  try {
    const parsed = JSON.parse(trimmed);

    const blocks: unknown[] = Array.isArray(parsed.blocks)
      ? parsed.blocks
      : Array.isArray(parsed)
      ? parsed
      : [];

    if (blocks.length > 0 && typeof (blocks[0] as Record<string, unknown>).content === 'string') {
      return blocks
        .filter((b: unknown) => typeof (b as Record<string, unknown>).content === 'string')
        .map((b: unknown) => ((b as Record<string, unknown>).content as string).trim())
        .filter(Boolean);
    }
  } catch {
    // fall through
  }

  // Fallback: use normalizeContent and split on newlines
  return normalizeContent(raw).split('\n').filter(Boolean);
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const LiveDocuments = () => {
  const [isAddingNote, setIsAddingNote]       = useState(false);
  const [notes, setNotes]                     = useState<ScribbleNote[]>([]);
  const [notesLoading, setNotesLoading]       = useState(true);
  const [deletingId, setDeletingId]           = useState<string | null>(null);
  const channelRef                            = useRef<RealtimeChannel | null>(null);
  const ensureSessionValid                    = useAuthStore((s) => s.ensureSessionValid);
  const refreshSession                        = useAuthStore((s) => s.refreshSession);

  /* ── Helpers ────────────────────────────────────────────────── */

  /** Build a deep-link URL for a given noteId using the current session. */
  const buildDeepLink = useCallback(
    (noteId: string, session: { access_token: string; refresh_token?: string | null }) =>
      [
        `${MOBILE_APP_DEEP_LINK}/${noteId}`,
        `?access_token=${encodeURIComponent(session.access_token)}`,
        `&refresh_token=${encodeURIComponent(session.refresh_token ?? '')}`,
      ].join(''),
    [],
  );

  /** Delete a note row from the DB and remove it from local state. */
  const deleteNote = useCallback(async (inputUuid: string) => {
    setDeletingId(inputUuid);
    const { error } = await supabase
      .schema('module5')
      .from('scribble_text')
      .delete()
      .eq('input_uuid', inputUuid);

    if (error) {
      console.error('[Delete] Failed:', error.message);
    } else {
      setNotes((prev) => prev.filter((n) => n.input_uuid !== inputUuid));
    }
    setDeletingId(null);
  }, []);

  /* ── Page-load: fetch all notes, auto-delete empty stubs ────────── */
  useEffect(() => {
    let cancelled = false;

    const loadNotes = async () => {
      setNotesLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setNotesLoading(false); return; }

      const { data, error } = await supabase
        .schema('module5')
        .from('scribble_text')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[PageLoad] Fetch failed:', error.message);
        if (!cancelled) setNotesLoading(false);
        return;
      }

      const all = (data ?? []) as ScribbleNote[];

      // Auto-cleanup: delete stubs older than 30 s that have no content
      const thirtySecondsAgo = Date.now() - 30_000;
      const emptyStubs = all.filter(
        (n) =>
          !normalizeContent(n.content) &&
          new Date(n.created_at).getTime() < thirtySecondsAgo,
      );

      for (const stub of emptyStubs) {
        console.log('[Cleanup] Deleting empty stub:', stub.input_uuid);
        await supabase
          .schema('module5')
          .from('scribble_text')
          .delete()
          .eq('input_uuid', stub.input_uuid);
      }

      const stubIds = new Set(emptyStubs.map((s) => s.input_uuid));
      const kept = all.filter((n) => !stubIds.has(n.input_uuid));

      if (!cancelled) {
        setNotes(kept);
        setNotesLoading(false);
      }
    };

    loadNotes();
    return () => { cancelled = true; };
  }, []);

  /* ── Realtime: table-level subscription for INSERT + UPDATE ────── */
  useEffect(() => {
    const channel = supabase
      .channel('scribble_text_all')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'module5', table: 'scribble_text' },
        (payload) => {
          const incoming = payload.new as ScribbleNote;
          setNotes((prev) =>
            prev.some((n) => n.input_uuid === incoming.input_uuid)
              ? prev
              : [incoming, ...prev],
          );
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'module5', table: 'scribble_text' },
        (payload) => {
          const updated = payload.new as ScribbleNote;
          setNotes((prev) =>
            prev.map((n) =>
              n.input_uuid === updated.input_uuid ? updated : n,
            ),
          );
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'module5', table: 'scribble_text' },
        (payload) => {
          const deleted = payload.old as Partial<ScribbleNote>;
          setNotes((prev) =>
            prev.filter((n) => n.input_uuid !== deleted.input_uuid),
          );
        },
      )
      .subscribe((status) =>
        console.log('[Realtime] Table subscription:', status),
      );

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, []);

  /* ── Add New Note ───────────────────────────────────────────── */
  const handleAddNote = async () => {
    setIsAddingNote(true);

    try {
      // 1. Ensure session is valid
      const isValid = await ensureSessionValid({ refreshOnExpired: true });
      if (!isValid) {
        const refreshed = await refreshSession();
        if (!refreshed) { alert('Your session has expired. Please log in again.'); return; }
      }

      let { data: { session } } = await supabase.auth.getSession();
      if (!session) { alert('Please log in to create a note.'); return; }

      // Near-expiry guard
      if (session.expires_at && session.expires_at - Math.floor(Date.now() / 1000) < 60) {
        const { data: r } = await supabase.auth.refreshSession();
        if (r.session) session = r.session;
      }

      // 2. Generate UUID
      const noteId: string =
        typeof crypto?.randomUUID === 'function'
          ? crypto.randomUUID()
          : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0;
              return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
            });

      // 3. Insert stub row
      const { data: insertData, error: insertError } = await supabase
        .schema('module5')
        .from('scribble_text')
        .insert({ user_id: session.user.id, input_uuid: noteId, content: null })
        .select()
        .single();

      if (insertError || !insertData) {
        console.error('[AddNote] Insert failed:', insertError?.message);
        alert(`Could not create the note.\n\n${insertError?.message ?? 'Unknown error'}`);
        return;
      }

      // Optimistically add to list (realtime INSERT will also fire)
      setNotes((prev) => [insertData as ScribbleNote, ...prev]);

      // 4. Deep-link to mobile app
      window.location.href = buildDeepLink(noteId, session);

      setTimeout(() => {
        if (!document.hidden)
          window.open(`${WEB_FALLBACK_URL}?noteId=${encodeURIComponent(noteId)}`, '_blank');
      }, 3000);
    } catch (err) {
      console.error('[AddNote] Unhandled error:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsAddingNote(false);
    }
  };

  /* ── Click existing note → open in mobile app for editing ──────── */
  const handleNoteClick = useCallback(async (inputUuid: string) => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) { alert('Please log in to edit this note.'); return; }
    window.location.href = buildDeepLink(inputUuid, session);
    setTimeout(() => {
      if (!document.hidden)
        window.open(`${WEB_FALLBACK_URL}?noteId=${encodeURIComponent(inputUuid)}`, '_blank');
    }, 3000);
  }, [buildDeepLink]);

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <>
      <BreadcrumbComp title="Module 5 - Note App" items={BCrumb} />

      <div className="grid grid-cols-12 gap-6">

        {/* ── Toolbar card ─────────────────────────────────────────── */}
        <div className="col-span-12">
          <CardBox className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold">My Notes</h2>
                {!notesLoading && (
                  <Badge variant="secondary" className="text-xs">
                    {notes.length}
                  </Badge>
                )}
              </div>

              <Button
                onClick={handleAddNote}
                disabled={isAddingNote}
                size="lg"
                className="gap-2 px-6 h-10 font-semibold whitespace-nowrap"
              >
                {isAddingNote ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting…
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add New Note
                  </>
                )}
              </Button>
            </div>
          </CardBox>
        </div>

        {/* ── Notes list ───────────────────────────────────────────── */}
        <div className="col-span-12">
          {notesLoading ? (
            <div className="flex items-center gap-2 justify-center text-muted-foreground py-12">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading notes…
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-muted-foreground py-16">
              <PenTool className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No notes yet.</p>
              <p className="text-xs mt-1 opacity-60">Click “Add New Note” to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {notes.map((n) => {
                const text = normalizeContent(n.content);
                const blocks = extractBlocks(n.content);
                const preview = blocks[0] ?? '';
                const hasContent = Boolean(text);

                return (
                  <CardBox key={n.input_uuid} className="p-0 overflow-hidden">
                    {/* Clickable content area */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleNoteClick(n.input_uuid)}
                      onKeyDown={(e) => e.key === 'Enter' && handleNoteClick(n.input_uuid)}
                      title="Click to open and edit in mobile app"
                      className="group relative p-5 cursor-pointer hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-30"
                    >
                      {/* Edit hint */}
                      <span className="absolute top-3 right-3 hidden group-hover:flex items-center gap-1 text-xs text-muted-foreground">
                        <PenTool className="h-3 w-3" />
                        Edit
                      </span>

                      {hasContent ? (
                        <p
                          className="text-sm leading-relaxed line-clamp-4"
                          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                        >
                          {preview}
                          {blocks.length > 1 && (
                            <span className="text-muted-foreground">
                              {' '}…
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Empty note
                        </p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/20">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(n.updated_at ?? n.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 ${
                          hasContent ? 'border-green-500/40 text-green-600' : 'border-amber-500/40 text-amber-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${
                            hasContent ? 'bg-green-500' : 'bg-amber-500 animate-pulse'
                          }`}
                        />
                        {hasContent ? 'Saved' : 'Waiting…'}
                      </Badge>

                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNote(n.input_uuid); }}
                        disabled={deletingId === n.input_uuid}
                        title="Delete note"
                        className="ml-1 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      >
                        {deletingId === n.input_uuid
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </CardBox>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default LiveDocuments;


