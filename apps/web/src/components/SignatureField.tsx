'use client';

import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import SignaturePad from 'signature_pad';

export interface SignaturePadHandle {
  toDataURL: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
}

const SignatureField = forwardRef<SignaturePadHandle>((_props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    c.getContext('2d')?.scale(ratio, ratio);
    padRef.current = new SignaturePad(c, { backgroundColor: 'rgba(0,0,0,0)', penColor: '#34d399' });
    return () => padRef.current?.off();
  }, []);

  useImperativeHandle(ref, () => ({
    toDataURL: () => (padRef.current && !padRef.current.isEmpty() ? padRef.current.toDataURL('image/png') : null),
    clear: () => padRef.current?.clear(),
    isEmpty: () => padRef.current?.isEmpty() ?? true,
  }));

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 150, background: '#0c1527', border: '1.5px solid #1a2540', borderRadius: 10, touchAction: 'none', cursor: 'crosshair' }}
    />
  );
});

SignatureField.displayName = 'SignatureField';
export default SignatureField;
