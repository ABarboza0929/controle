/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import Modal from './Modal';
import { useInventoryStore, useAuthStore, Product } from '../lib/state';

interface MoveProductFormProps {
  onClose: () => void;
  product: Product;
}

export default function MoveProductForm({
  onClose,
  product,
}: MoveProductFormProps) {
  const [newLocation, setNewLocation] = useState('');
  const moveProduct = useInventoryStore((state) => state.moveProduct);
  const { currentUser } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLocation.trim() && currentUser) {
      moveProduct(product.id, newLocation.trim(), currentUser.username);
      onClose();
    }
  };

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2>Movimentar Produto</h2>
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
              Localização Atual: <span>{product.location || 'N/A'}</span>
            </p>
          </div>
          <div className="form-field">
            <label htmlFor="new-location">Nova Localização</label>
            <input
              id="new-location"
              name="newLocation"
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Ex: Prateleira B-2"
              required
              autoFocus
            />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="primary">
            Confirmar Movimentação
          </button>
        </div>
      </form>
    </Modal>
  );
}
