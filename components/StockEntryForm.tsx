/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import Modal from './Modal';
import { useInventoryStore, useAuthStore, Product } from '../lib/state';

interface StockEntryFormProps {
  onClose: () => void;
  product: Product;
}

export default function StockEntryForm({
  onClose,
  product,
}: StockEntryFormProps) {
  const [quantity, setQuantity] = useState(1);
  const addStock = useInventoryStore(state => state.addStock);
  const { currentUser } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity > 0 && currentUser) {
      addStock(product.id, quantity, 'entrada', currentUser.username);
      onClose();
    }
  };

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2>Adicionar Estoque</h2>
          <button type="button" onClick={onClose} className="modalClose">
            <span className="icon">close</span>
          </button>
        </div>
        <div className="modalContent">
          <div className="stock-entry-info">
            <p>
              Produto: <span>{product.name}</span>
            </p>
            <p>
              Estoque Atual: <span>{product.quantity}</span>
            </p>
          </div>
          <div className="form-field">
            <label htmlFor="quantity">Quantidade a Adicionar</label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value, 10))}
              min="1"
              autoFocus
            />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="primary">
            Confirmar Entrada
          </button>
        </div>
      </form>
    </Modal>
  );
}
