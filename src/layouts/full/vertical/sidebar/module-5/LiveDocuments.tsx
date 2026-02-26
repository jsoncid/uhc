import React, { useState } from 'react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Badge } from 'src/components/ui/badge';
import {
  PenTool,
  Search,
  BookOpen,
  Sparkles,
  ExternalLink,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';
import { useAuthStore } from '../../../../../stores/useAuthStore';

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

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const LiveDocuments = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const ensureSessionValid = useAuthStore((s) => s.ensureSessionValid);
  const refreshSession = useAuthStore((s) => s.refreshSession);

  /**
   * Handles the Write button click.
   *
   * Flow:
   *  1. Validate / refresh the Supabase session so tokens are fresh.
   *  2. Generate a unique noteId (UUID v4).
   *  3. INSERT a stub row into `scribble_text` (awaited! redirect NEVER fires before this resolves).
   *  4. Redirect to the mobile app via deep link with fresh tokens.
   */
  const handleWriteClick = async () => {
    setIsGeneratingCode(true);
    console.log('[Write] Button clicked – starting flow…');

    try {
      /* ── Step 1 : Ensure authenticated & tokens are fresh ────────── */
      console.log('[Write] Step 1 → Validating session…');

      const isValid = await ensureSessionValid({ refreshOnExpired: true });
      console.log('[Write] ensureSessionValid returned:', isValid);

      if (!isValid) {
        console.warn('[Write] Session invalid – attempting explicit refresh…');
        const refreshed = await refreshSession();
        console.log('[Write] refreshSession returned:', refreshed);
        if (!refreshed) {
          alert('Your session has expired. Please log in again.');
          return;
        }
      }

      // Retrieve the (now guaranteed-fresh) session object
      const { data: { session: currentSession }, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !currentSession) {
        console.error('[Write] No session after refresh:', sessionError);
        alert('Please log in to access the mobile app.');
        return;
      }

      console.log('[Write] Session OK ─ user.id:', currentSession.user.id);
      console.log('[Write] Token expires_at:', currentSession.expires_at,
        '→ remaining (s):', currentSession.expires_at
          ? currentSession.expires_at - Math.floor(Date.now() / 1000)
          : 'unknown');

      // Use a mutable reference so we can swap in a refreshed session below
      let session = currentSession;

      // Extra guard: make sure tokens are not about to expire (< 60 s remaining)
      const expiresAt = session.expires_at; // unix seconds
      if (expiresAt && expiresAt - Math.floor(Date.now() / 1000) < 60) {
        console.warn('[Write] Token near-expiry (<60 s) – forcing refresh…');
        const { data: refreshData, error: refreshError } =
          await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          console.error('[Write] Near-expiry refresh failed:', refreshError);
          alert('Unable to refresh your session. Please log in again.');
          return;
        }
        session = refreshData.session;
        console.log('[Write] Refreshed – new expires_at:', session.expires_at);
      }

      /* ── Step 2 : Generate a unique note ID (UUID v4) ───────────── */
      const noteId: string =
        typeof crypto?.randomUUID === 'function'
          ? crypto.randomUUID()
          : // Fallback for older browsers (RFC-4122 v4)
            'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0;
              return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
            });

      console.log('[Write] Step 2 → Generated noteId:', noteId);

      /* ── Step 3 : Insert stub row into scribble_text ────────────── */
      console.log('[Write] Step 3 → Inserting into scribble_text…');
      console.log('[Write] Payload:', {
        user_id:    session.user.id,
        input_uuid: noteId,
        content:    null,
      });

      const { data: insertData, error: insertError } = await supabase
        .schema('module5')               // ← table lives in module5 schema, NOT public
        .from('scribble_text')
        .insert({
          user_id:    session.user.id,   // must match auth.uid() for RLS
          input_uuid: noteId,
          content:    null,              // mobile app will populate this
        })
        .select()                        // ← CRITICAL: without .select() Supabase returns { data: null }
        .single();                       // we expect exactly one row back

      // Log the full Supabase response for debugging
      console.log('[Write] Insert response – data:', insertData);
      console.log('[Write] Insert response – error:', insertError);

      if (insertError) {
        console.error('[Write] ❌ Insert FAILED:', insertError.message, insertError.details, insertError.hint);
        alert(`Could not create the note.\n\nError: ${insertError.message}`);
        return;
      }

      // Guard against silent RLS denial (error is null but data is also null)
      if (!insertData) {
        console.error('[Write] ❌ Insert returned no data and no error – likely an RLS policy denial.');
        alert('Could not create the note. (Row-Level Security may be blocking the insert – check Supabase policies.)');
        return;
      }

      console.log('[Write] ✅ Row inserted successfully. DB id:', insertData.id);

      /* ── Step 4 : Build deep link & redirect ────────────────────── */
      console.log('[Write] Step 4 → Building deep link…');

      const deepLinkUrl = [
        `${MOBILE_APP_DEEP_LINK}/${noteId}`,
        `?access_token=${encodeURIComponent(session.access_token)}`,
        `&refresh_token=${encodeURIComponent(session.refresh_token ?? '')}`,
      ].join('');

      const webFallbackUrl = `${WEB_FALLBACK_URL}?noteId=${encodeURIComponent(noteId)}`;

      // Sanitised log (never log real tokens)
      console.log(
        '[Write] Deep link (tokens redacted):',
        deepLinkUrl
          .replace(encodeURIComponent(session.access_token), '<access_token>')
          .replace(encodeURIComponent(session.refresh_token ?? ''), '<refresh_token>'),
      );

      // Redirect – this is AFTER the awaited insert, so the row is guaranteed to exist
      window.location.href = deepLinkUrl;

      setTimeout(() => {
        if (!document.hidden) {
          console.log('[Write] Deep link may not have been handled – opening web fallback');
          window.open(webFallbackUrl, '_blank');
        }
      }, 3000);

    } catch (error) {
      console.error('[Write] ❌ Unhandled exception:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsGeneratingCode(false);
    }
  };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <>
      <BreadcrumbComp title="Module 5 - Note App" items={BCrumb} />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <CardBox className="p-6">
            <div className="space-y-6">
              {/* Search Bar with Write Button */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  
                </div>
                <Button
                  onClick={handleWriteClick}
                  disabled={isGeneratingCode}
                  size="lg"
                  className="gap-2 px-6 h-12 font-semibold whitespace-nowrap"
                >
                  {isGeneratingCode ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <PenTool className="h-4 w-4" />
                      Write
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardBox>
        </div>
      </div>
    </>
  );
};

export default LiveDocuments;
