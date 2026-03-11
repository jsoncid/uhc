import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { supabase } from '@/lib/supabase';
import { Button } from 'src/components/ui/button';
import { IconCamera, IconCheck, IconAlertTriangle, IconLoader2 } from '@tabler/icons-react';

interface FaceRegistrationProps {
  userId: string;
  onComplete: () => void;
}

type Status = 'loading-models' | 'checking' | 'ready' | 'capturing' | 'saving' | 'success' | 'error';

const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: 'user',
    width: { ideal: 480 },
    height: { ideal: 360 },
    frameRate: { ideal: 15 },
  },
};

const snapshotToCanvas = (video: HTMLVideoElement): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d')!.drawImage(video, 0, 0);
  return canvas;
};

const FaceRegistration = ({ userId, onComplete }: FaceRegistrationProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<Status>('loading-models');
  const [errorMsg, setErrorMsg] = useState('');

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setStatus('error');
      setErrorMsg('Could not access camera. Please allow camera permissions and try again.');
    }
  }, []);

  // Load models → check existing profile → start camera
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // Load face-api models
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        if (cancelled) return;

        // Check if user already has a face profile
        setStatus('checking');
        const { count, error } = await supabase
          .schema('module5')
          .from('face_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (cancelled) return;

        if (error) {
          console.error('Error checking face profile:', error);
        }

        if (count && count > 0) {
          onComplete();
          return;
        }

        setStatus('ready');
        // Start camera after component is rendered in ready state
        setTimeout(() => {
          if (!cancelled) startCamera();
        }, 100);
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg('Failed to load face detection models.');
          console.error(err);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [userId, onComplete, startCamera, stopCamera]);

  const handleCapture = async () => {
    if (!videoRef.current) return;

    setStatus('capturing');
    setErrorMsg('');

    try {
      const canvas = snapshotToCanvas(videoRef.current);
      const detection = await faceapi
        .detectSingleFace(canvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.25 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus('ready');
        setErrorMsg('No face detected. Please align your face in the frame and try again.');
        return;
      }

      const descriptor = detection.descriptor;

      setStatus('saving');

      const { error } = await supabase
        .schema('module5')
        .from('face_profiles')
        .upsert(
          {
            user_id: userId,
            face_embedding: Array.from(descriptor),
          },
          { onConflict: 'user_id' },
        );

      if (error) {
        throw error;
      }

      stopCamera();
      setStatus('success');
      setTimeout(() => onComplete(), 1500);
    } catch (err) {
      console.error('Face registration error:', err);
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save face profile.');
    }
  };

  const handleRetry = () => {
    setErrorMsg('');
    setStatus('ready');
    if (!streamRef.current) {
      startCamera();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Loading state */}
      {(status === 'loading-models' || status === 'checking') && (
        <div className="flex flex-col items-center gap-3 py-8">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {status === 'loading-models' ? 'Loading face detection models...' : 'Checking existing profile...'}
          </p>
        </div>
      )}

      {/* Camera + instructions */}
      {(status === 'ready' || status === 'capturing') && (
        <>
          <div className="text-center mb-2">
            <p className="text-sm font-medium text-foreground">Align your face in the frame</p>
            <p className="text-xs text-muted-foreground">Look directly at the camera</p>
          </div>

          <div className="relative rounded-lg overflow-hidden border border-border bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              width={480}
              height={360}
              className="block"
              style={{ transform: 'scaleX(-1)' }}
            />
            {status === 'capturing' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <IconLoader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>

          <Button onClick={handleCapture} disabled={status === 'capturing'} className="w-full max-w-xs">
            <IconCamera className="h-4 w-4 mr-2" />
            {status === 'capturing' ? 'Detecting face...' : 'Capture Face'}
          </Button>

          <Button variant="ghost" size="sm" onClick={onComplete} className="text-muted-foreground">
            Skip for now
          </Button>
        </>
      )}

      {/* Saving */}
      {status === 'saving' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Saving face profile...</p>
        </div>
      )}

      {/* Success */}
      {status === 'success' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
            <IconCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            Face registered successfully!
          </p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="flex flex-col items-center gap-3 py-4 w-full">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <IconAlertTriangle className="h-5 w-5" />
            <p className="text-sm">{errorMsg}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRetry}>
              Try Again
            </Button>
            <Button variant="ghost" size="sm" onClick={onComplete}>
              Skip for now
            </Button>
          </div>
        </div>
      )}

      {/* Error message inline (e.g. no face detected while still on ready) */}
      {status === 'ready' && errorMsg && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}
    </div>
  );
};

export default FaceRegistration;
