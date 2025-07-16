/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import Modal from './Modal';
import { useInventoryStore, useAuthStore, Product } from '../lib/state';

interface StockCheckoutFormProps {
  onClose: () => void;
  product: Product;
}

export default function StockCheckoutForm({
  onClose,
  product,
}: StockCheckoutFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [withdrawnBy, setWithdrawnBy] = useState('');
  const [error, setError] = useState('');
  const { checkoutStock } = useInventoryStore();
  const { currentUser } = useAuthStore();

  useEffect(() => {
    if (currentUser) {
      setWithdrawnBy(currentUser.username);
    }
  }, [currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!withdrawnBy.trim()) {
      setError('O nome de quem retira o produto é obrigatório.');
      return;
    }

    if (quantity <= 0) {
      setError('A quantidade de saída deve ser maior que zero.');
      return;
    }
    if (quantity > product.quantity) {
      setError('A quantidade de saída não pode ser maior que o estoque atual.');
      return;
    }

    if (currentUser) {
      checkoutStock(product.id, quantity, withdrawnBy, currentUser.username);
      onClose();
    } else {
      setError('Erro: Usuário não identificado. Faça login novamente.');
    }
  };

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2>Registrar Saída de Produto</h2>
          <button type="button" onClick={onClose} className="modalClose">
            <span className="icon">close</span>
          </button>
        </div>
        <div className="modalContent">
          <div className="stock-entry-info form-grid two-cols">
            <p>
              <strong>Data:</strong>{' '}
              <span>{new Date().toLocaleDateString('pt-BR')}</span>
            </p>
            <p>
              <strong>Usuário:</strong> <span>{currentUser?.username}</span>
            </p>
            <p>
              <strong>Produto:</strong> <span>{product.name}</span>
            </p>
            <p>
              <strong>Código:</strong> <span>{product.id}</span>
            </p>
            <p>
              <strong>Estoque Atual:</strong> <span>{product.quantity}</span>
            </p>
            <p>
              <strong>Localização:</strong> <span>{product.location}</span>
            </p>
          </div>

          <div className="form-field" style={{ marginTop: '24px' }}>
            <label htmlFor="withdrawnBy">Retirado por</label>
            <input
              id="withdrawnBy"
              name="withdrawnBy"
              type="text"
              value={withdrawnBy}
              onChange={e => setWithdrawnBy(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-field" style={{ marginTop: '16px' }}>
            <label htmlFor="quantity">Quantidade de Saída</label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value, 10) || 0)}
              min="1"
              max={product.quantity}
              required
            />
          </div>
          {error && (
            <p className="error-message" style={{ marginTop: '16px' }}>
              {error}
            </p>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="primary">
            Confirmar Saída
          </button>
        </div>
      </form>
    </Modal>
  );
}
