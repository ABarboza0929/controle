/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import Modal from './Modal';
import { Product } from '../lib/state';

interface PrintLabelModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function PrintLabelModal({
  product,
  onClose,
}: PrintLabelModalProps) {
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (product && qrCodeRef.current) {
      QRCode.toCanvas(
        qrCodeRef.current,
        product.id,
        {
          width: 150, // Higher resolution for better printing quality
          margin: 1,
          errorCorrectionLevel: 'H',
        },
        error => {
          if (error) console.error('Erro ao gerar QR Code:', error);
        }
      );
    }
  }, [product]);

  if (!product) {
    return null;
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h2>Etiqueta do Produto</h2>
        <button type="button" onClick={onClose} className="modalClose">
          <span className="icon">close</span>
        </button>
      </div>
      <div className="modalContent">
        <div id="label-to-print">
          <h3>{product.name}</h3>
          <div className="barcode-container">
            <canvas ref={qrCodeRef}></canvas>
          </div>
          <p>{product.id}</p>
        </div>
        <p
          style={{
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginTop: '16px',
          }}
        >
          Pré-visualização da etiqueta (formato 34x23mm).
        </p>
      </div>
      <div className="modal-footer">
        <button type="button" className="secondary" onClick={onClose}>
          Fechar
        </button>
        <button type="button" className="primary" onClick={handlePrint}>
          <span className="icon">print</span>
          Imprimir
        </button>
      </div>
    </Modal>
  );
}
