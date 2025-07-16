/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useEffect, useState } from 'react';
import jsQR from 'jsqr';
import Modal from './Modal';

interface BarcodeScannerModalProps {
  onClose: () => void;
  onScanSuccess: (data: string) => void;
}

export default function BarcodeScannerModal({
  onClose,
  onScanSuccess,
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');
  const animationFrameId = useRef<number | undefined>(undefined);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const tick = () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        canvasRef.current
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code) {
            onScanSuccess(code.data);
            onClose();
            return; // Stop scanning
          }
        }
      }
      animationFrameId.current = requestAnimationFrame(tick);
    };

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        animationFrameId.current = requestAnimationFrame(tick);
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError(
          'Não foi possível acessar a câmera. Verifique as permissões do seu navegador.'
        );
      }
    };

    startCamera();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h2>Escanear Código</h2>
        <button type="button" onClick={onClose} className="modalClose">
          <span className="icon">close</span>
        </button>
      </div>
      <div
        className="modalContent"
        style={{ padding: '0', position: 'relative' }}
      >
        {error && (
          <div className="error-message" style={{ margin: '20px' }}>
            {error}
          </div>
        )}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          style={{
            width: '100%',
            height: 'auto',
            display: error ? 'none' : 'block',
          }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {!error && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              right: '10px',
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: 'white',
              padding: '8px',
              borderRadius: '4px',
              textAlign: 'center',
              fontSize: '14px',
            }}
          >
            Aponte a câmera para um código de barras ou QR code.
          </div>
        )}
      </div>
    </Modal>
  );
}