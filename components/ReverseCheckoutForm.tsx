/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import Modal from './Modal';
import {
  useInventoryStore,
  useAuthStore,
  CheckoutHistoryEntry,
} from '../lib/state';

interface ReverseCheckoutFormProps {
  onClose: () => void;
}

export default function ReverseCheckoutForm({
  onClose,
}: ReverseCheckoutFormProps) {
  const [sequenceIdInput, setSequenceIdInput] = useState('');
  const [quantityToReverse, setQuantityToReverse] = useState('');
  const [entryToReverse, setEntryToReverse] =
    useState<CheckoutHistoryEntry | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { checkoutHistory, reverseCheckout } = useInventoryStore();
  const { currentUser } = useAuthStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEntryToReverse(null);

    const id = parseInt(sequenceIdInput, 10);
    if (isNaN(id)) {
      setError('Por favor, insira um número de registro válido.');
      return;
    }

    const foundEntry = checkoutHistory.find(entry => entry.sequenceId === id);

    if (!foundEntry) {
      setError(
        `Nenhum registro de saída encontrado com o número ${sequenceIdInput}.`
      );
      return;
    }

    const maxReversibleQty =
      foundEntry.quantity - (foundEntry.reversedQuantity || 0);

    if (maxReversibleQty <= 0) {
      setError('Este registro de saída já foi totalmente estornado.');
      return;
    }

    setEntryToReverse(foundEntry);
    setQuantityToReverse(String(maxReversibleQty));
  };

  const handleConfirmReversal = () => {
    if (!entryToReverse || !currentUser) return;
    const qty = parseInt(quantityToReverse, 10);

    const result = reverseCheckout(
      entryToReverse.sequenceId,
      qty,
      currentUser.username
    );

    if (result.success) {
      setSuccess(result.message);
      setError('');
      setEntryToReverse(null);
      setSequenceIdInput('');
      setTimeout(onClose, 2000);
    } else {
      setError(result.message);
      setSuccess('');
    }
  };

  const maxReversible = entryToReverse
    ? entryToReverse.quantity - (entryToReverse.reversedQuantity || 0)
    : 0;

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h2>Estornar Saída de Produto</h2>
        <button type="button" onClick={onClose} className="modalClose">
          <span className="icon">close</span>
        </button>
      </div>
      <div className="modalContent">
        <form onSubmit={handleSearch} className="form-grid">
          <div className="form-field">
            <label htmlFor="sequenceId">Número do Registro de Saída</label>
            <div className="ai-input-group">
              <input
                id="sequenceId"
                type="number"
                value={sequenceIdInput}
                onChange={e => setSequenceIdInput(e.target.value)}
                placeholder="Ex: 000001"
                required
                autoFocus
                disabled={!!entryToReverse || !!success}
              />
              <button
                type="submit"
                className="secondary"
                disabled={!sequenceIdInput || !!entryToReverse || !!success}
              >
                Buscar
              </button>
            </div>
          </div>
        </form>

        {entryToReverse && (
          <div
            style={{
              marginTop: '24px',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '24px',
            }}
          >
            <h4>Confirmar Estorno</h4>
            <div className="stock-entry-info" style={{ marginBottom: '16px' }}>
              <p>
                <strong>Produto:</strong>{' '}
                <span>
                  {entryToReverse.productName} ({entryToReverse.productSku})
                </span>
              </p>
              <p>
                <strong>Qtde. da Saída Original:</strong>{' '}
                <span>{entryToReverse.quantity}</span>
              </p>
              <p>
                <strong>Qtde. já Estornada:</strong>{' '}
                <span>{entryToReverse.reversedQuantity || 0}</span>
              </p>
            </div>

            <div className="form-field">
              <label htmlFor="quantityToReverse">Quantidade a Estornar</label>
              <input
                id="quantityToReverse"
                type="number"
                value={quantityToReverse}
                onChange={e => setQuantityToReverse(e.target.value)}
                min="1"
                max={maxReversible}
                required
                disabled={!!success}
              />
            </div>
          </div>
        )}

        {error && (
          <p className="error-message" style={{ marginTop: '16px' }}>
            {error}
          </p>
        )}
        {success && (
          <p
            style={{
              color: 'var(--success-color)',
              background: '#e8f5e9',
              border: '1px solid var(--success-color)',
              borderRadius: '4px',
              padding: '12px',
              marginTop: '16px',
            }}
          >
            {success}
          </p>
        )}
      </div>
      <div className="modal-footer">
        <button type="button" className="secondary" onClick={onClose}>
          {success ? 'Fechar' : 'Cancelar'}
        </button>
        <button
          type="button"
          className="primary"
          onClick={handleConfirmReversal}
          disabled={!entryToReverse || !!success}
        >
          Confirmar Estorno
        </button>
      </div>
    </Modal>
  );
}
