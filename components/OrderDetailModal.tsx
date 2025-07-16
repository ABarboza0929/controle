/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import Modal from './Modal';
import { Order } from '../lib/state';

interface OrderDetailModalProps {
  onClose: () => void;
  order: Order;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function OrderDetailModal({
  onClose,
  order,
}: OrderDetailModalProps) {
  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h2>Detalhes do Pedido: {order.orderNumber}</h2>
        <button type="button" onClick={onClose} className="modalClose">
          <span className="icon">close</span>
        </button>
      </div>
      <div className="modalContent">
        <div className="form-grid">
          <div className="form-grid two-cols">
            <p>
              <strong>Fornecedor:</strong> {order.supplierName}
            </p>
            <p>
              <strong>CNPJ:</strong> {order.supplierTaxId}
            </p>
            <p>
              <strong>Data Emissão:</strong>{' '}
              {new Date(order.issueDate).toLocaleDateString('pt-BR', {
                timeZone: 'UTC',
              })}
            </p>
            <p>
              <strong>Data Entrega:</strong>{' '}
              {new Date(order.deliveryDate).toLocaleDateString('pt-BR', {
                timeZone: 'UTC',
              })}
            </p>
            <p>
              <strong>Cond. Pagamento:</strong> {order.paymentTerms}
            </p>
            {order.firstDueDate && (
              <p>
                <strong>Venc. 1ª Parcela:</strong>{' '}
                {new Date(order.firstDueDate).toLocaleDateString('pt-BR', {
                  timeZone: 'UTC',
                })}
              </p>
            )}
            <p>
              <strong>Centro de Custo:</strong> {order.costCenter}
            </p>
            <p>
              <strong>Solicitante:</strong> {order.requester}
            </p>
            <p>
              <strong>Status:</strong> {order.status}
            </p>
            <p>
              <strong>Importado por:</strong> {order.importedBy} em{' '}
              {new Date(order.importedAt).toLocaleString('pt-BR')}
            </p>
          </div>

          <h4 style={{ marginTop: '16px' }}>Itens do Pedido</h4>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Cód. Forn.</th>
                  <th>Descrição</th>
                  <th>Qtde</th>
                  <th>Vlr. Unit.</th>
                  <th>Vlr. Total</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item, index) => (
                  <tr key={index}>
                    <td>{item.supplierCode}</td>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td>{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    colSpan={4}
                    style={{ textAlign: 'right', fontWeight: 'bold' }}
                  >
                    Valor Total do Pedido:
                  </td>
                  <td style={{ fontWeight: 'bold' }}>
                    {formatCurrency(order.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {order.originalImage && (
            <details style={{ marginTop: '16px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 500 }}>
                Ver Imagem Original do Pedido
              </summary>
              <img
                src={`data:image/jpeg;base64,${order.originalImage}`}
                alt="Imagem original do pedido de compra"
                style={{
                  maxWidth: '100%',
                  borderRadius: 'var(--border-radius)',
                  marginTop: '8px',
                  border: '1px solid var(--border-color)',
                }}
              />
            </details>
          )}
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="primary" onClick={onClose}>
          Fechar
        </button>
      </div>
    </Modal>
  );
}