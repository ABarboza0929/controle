/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import Modal from './Modal';
import { OrderData } from '../lib/state';

interface OrderReviewModalProps {
  onClose: () => void;
  orderData: OrderData;
  imageBase64: string;
  onSave: (orderData: OrderData, imageBase64: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const costCenterOptions = [
  'Administrativo',
  'Operações',
  'Consumo',
  'Consumíveis',
];
const statusOptions = ['Aprovado', 'Pendente de Aprovação', 'Rejeitado'];
const paymentTermsOptions = [
  'À Vista',
  'Carteira',
  'PIX',
  'Boleto 15 dias',
  'Boleto 30 dias',
  'Boleto 30/60 dias',
  'Boleto 30/60/90 dias',
];

export default function OrderReviewModal({
  onClose,
  orderData,
  imageBase64,
  onSave,
}: OrderReviewModalProps) {
  const [formData, setFormData] = useState<OrderData>({
    ...orderData,
    items: orderData.items || [],
    firstDueDate: orderData.firstDueDate || '',
  });

  const handleHeaderChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'totalAmount'
          ? parseFloat(value.replace(',', '.')) || 0
          : value,
    }));
  };

  const handleItemChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const newItems = [...formData.items];
    const item = { ...newItems[index] };

    (item as any)[name] = ['quantity', 'unitPrice', 'totalPrice'].includes(
      name
    )
      ? parseFloat(value) || 0
      : value;

    if (name === 'quantity' || name === 'unitPrice') {
      item.totalPrice = (item.quantity || 0) * (item.unitPrice || 0);
    }

    newItems[index] = item;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSave = () => {
    const totalFromItems = formData.items.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );
    onSave({ ...formData, totalAmount: totalFromItems }, imageBase64);
  };

  const handleSetDate = (
    fieldName: 'deliveryDate' | 'firstDueDate',
    daysToAdd: number | null
  ) => {
    if (daysToAdd === null) {
      setFormData(prev => ({ ...prev, [fieldName]: '' }));
      return;
    }
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    const dateString = date.toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      [fieldName]: dateString,
    }));
  };

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h2>Revisar Pedido Importado</h2>
        <button type="button" onClick={onClose} className="modalClose">
          <span className="icon">close</span>
        </button>
      </div>
      <div className="modalContent">
        <div className="form-grid">
          <h4>Dados do Pedido</h4>
          <div className="form-grid two-cols">
            <div className="form-field">
              <label>Nº do Pedido</label>
              <input
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleHeaderChange}
              />
            </div>
            <div className="form-field">
              <label>Data de Emissão</label>
              <input
                name="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={handleHeaderChange}
              />
            </div>
          </div>
          <div className="form-grid two-cols">
            <div className="form-field">
              <label>Fornecedor</label>
              <input
                name="supplierName"
                value={formData.supplierName}
                onChange={handleHeaderChange}
              />
            </div>
            <div className="form-field">
              <label>CNPJ do Fornecedor</label>
              <input
                name="supplierTaxId"
                value={formData.supplierTaxId}
                onChange={handleHeaderChange}
              />
            </div>
          </div>

          <h4 style={{ marginTop: '16px' }}>Itens do Pedido</h4>
          <div className="table-wrapper">
            <table className="order-review-items-table">
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>Cód. Forn.</th>
                  <th style={{ width: '45%' }}>Descrição</th>
                  <th style={{ width: '10%' }}>Qtd.</th>
                  <th style={{ width: '17.5%' }}>Valor Unitário</th>
                  <th style={{ width: '17.5%' }}>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        name="supplierCode"
                        value={item.supplierCode}
                        onChange={e => handleItemChange(index, e)}
                        placeholder="Código..."
                      />
                    </td>
                    <td>
                      <input
                        name="description"
                        value={item.description}
                        onChange={e => handleItemChange(index, e)}
                        placeholder="Descrição do item..."
                      />
                    </td>
                    <td>
                      <input
                        name="quantity"
                        type="number"
                        value={item.quantity}
                        onChange={e => handleItemChange(index, e)}
                      />
                    </td>
                    <td>
                      <input
                        name="unitPrice"
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={e => handleItemChange(index, e)}
                      />
                    </td>
                    <td>
                      <input
                        name="totalPrice"
                        type="number"
                        step="0.01"
                        value={item.totalPrice}
                        onChange={e => handleItemChange(index, e)}
                        readOnly
                        style={{
                          backgroundColor: '#f8f9fa',
                          cursor: 'not-allowed',
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p
            style={{
              textAlign: 'right',
              fontWeight: 'bold',
              fontSize: '18px',
              marginTop: '8px',
            }}
          >
            Total:{' '}
            {formatCurrency(
              formData.items.reduce((sum, item) => sum + item.totalPrice, 0)
            )}
          </p>

          <h4 style={{ marginTop: '16px' }}>
            Dados Adicionais (Enriquecimento por IA)
          </h4>
          <div className="form-grid two-cols">
            <div className="form-field">
              <label>Centro de Custo</label>
              <select
                name="costCenter"
                value={formData.costCenter}
                onChange={handleHeaderChange}
              >
                <option value="">Selecione...</option>
                {costCenterOptions.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Condição de Pagamento</label>
              <select
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleHeaderChange}
              >
                <option value="">Selecione...</option>
                {paymentTermsOptions.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            {formData.paymentTerms.toLowerCase().includes('boleto') && (
              <div className="form-field full-width">
                <label>Vencimento da 1ª Parcela</label>
                <div className="date-input-group-wrapper">
                  <div className="date-input-container">
                    <input
                      id="firstDueDate"
                      name="firstDueDate"
                      type="date"
                      value={formData.firstDueDate || ''}
                      onChange={handleHeaderChange}
                    />
                    <label
                      htmlFor="firstDueDate"
                      className="calendar-icon-button"
                      aria-label="Abrir calendário"
                      title="Abrir calendário"
                    >
                      <span className="icon">calendar_today</span>
                    </label>
                  </div>
                  <div className="date-presets">
                    <button
                      type="button"
                      onClick={() => handleSetDate('firstDueDate', 0)}
                    >
                      Hoje
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDate('firstDueDate', 15)}
                    >
                      +15d
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDate('firstDueDate', 30)}
                    >
                      +30d
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDate('firstDueDate', 45)}
                    >
                      +45d
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="form-field full-width">
              <label>Previsão de Entrega</label>
              <div className="date-input-group-wrapper">
                <div className="date-input-container">
                  <input
                    id="deliveryDate"
                    name="deliveryDate"
                    type="date"
                    value={formData.deliveryDate}
                    onChange={handleHeaderChange}
                  />
                  <label
                    htmlFor="deliveryDate"
                    className="calendar-icon-button"
                    aria-label="Abrir calendário"
                    title="Abrir calendário"
                  >
                    <span className="icon">calendar_today</span>
                  </label>
                </div>
                <div className="date-presets">
                  <button
                    type="button"
                    onClick={() => handleSetDate('deliveryDate', 0)}
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDate('deliveryDate', 7)}
                  >
                    +7d
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDate('deliveryDate', 15)}
                  >
                    +15d
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDate('deliveryDate', 30)}
                  >
                    +30d
                  </button>
                </div>
              </div>
            </div>
            <div className="form-field">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleHeaderChange}
              >
                <option value="">Selecione...</option>
                {statusOptions.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Solicitante</label>
              <input
                name="requester"
                value={formData.requester}
                onChange={handleHeaderChange}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="secondary" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="primary" onClick={handleSave}>
          Salvar Pedido
        </button>
      </div>
    </Modal>
  );
}
