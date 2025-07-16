/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import Modal from './Modal';
import { Partner, PartnerData, usePartnerStore } from '../lib/state';

interface PartnerFormProps {
  onClose: () => void;
  partnerToEdit?: Partner;
}

export default function PartnerForm({
  onClose,
  partnerToEdit,
}: PartnerFormProps) {
  const { addPartner, updatePartner } = usePartnerStore();
  const [formData, setFormData] = useState<PartnerData>({
    type: 'cliente',
    name: '',
    taxId: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (partnerToEdit) {
      setFormData({
        type: partnerToEdit.type,
        name: partnerToEdit.name,
        taxId: partnerToEdit.taxId || '',
        contactName: partnerToEdit.contactName || '',
        phone: partnerToEdit.phone || '',
        email: partnerToEdit.email || '',
        address: partnerToEdit.address || '',
        notes: partnerToEdit.notes || '',
      });
    }
  }, [partnerToEdit]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError('O campo Nome / Razão Social é obrigatório.');
      return;
    }
    if (partnerToEdit) {
      updatePartner(partnerToEdit.id, formData);
    } else {
      addPartner(formData);
    }
    onClose();
  };

  const title = partnerToEdit ? 'Editar Contato' : 'Adicionar Novo Contato';

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit} className="form-container">
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} className="modalClose">
            <span className="icon">close</span>
          </button>
        </div>
        <div className="modalContent">
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="name">Nome / Razão Social</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>
            <div className="form-grid two-cols">
              <div className="form-field">
                <label htmlFor="type">Tipo</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="cliente">Cliente</option>
                  <option value="fornecedor">Fornecedor</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="taxId">CNPJ / CPF</label>
                <input
                  id="taxId"
                  name="taxId"
                  type="text"
                  value={formData.taxId}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-grid two-cols">
              <div className="form-field">
                <label htmlFor="contactName">Nome do Contato</label>
                <input
                  id="contactName"
                  name="contactName"
                  type="text"
                  value={formData.contactName}
                  onChange={handleChange}
                />
              </div>
              <div className="form-field">
                <label htmlFor="phone">Telefone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="form-field">
              <label htmlFor="address">Endereço</label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            <div className="form-field">
              <label htmlFor="notes">Observações</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
            {error && (
              <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="primary">
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  );
}
