/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { useInventoryStore } from '../lib/state';
import BarcodeScannerModal from './BarcodeScannerModal';

export default function CheckoutHistory() {
  const checkoutHistory = useInventoryStore(state => state.checkoutHistory);

  const [dateFilter, setDateFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [skuFilter, setSkuFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const filteredHistory = checkoutHistory.filter(entry => {
    const entryDate = new Date(entry.date).toISOString().split('T')[0];
    const matchesDate = !dateFilter || entryDate === dateFilter;
    const matchesProduct =
      !productFilter ||
      entry.productName.toLowerCase().includes(productFilter.toLowerCase());
    const matchesSku =
      !skuFilter ||
      entry.productSku.toLowerCase().includes(skuFilter.toLowerCase());
    const matchesUser =
      !userFilter ||
      entry.withdrawnBy.toLowerCase().includes(userFilter.toLowerCase());

    return matchesDate && matchesProduct && matchesSku && matchesUser;
  });

  return (
    <div className="product-list">
      <div className="product-list-header">
        <h2>Histórico de Saídas</h2>
      </div>
      <div className="history-filter-bar">
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          title="Pesquisar por data"
        />
        <input
          type="text"
          placeholder="Pesquisar por Produto..."
          value={productFilter}
          onChange={e => setProductFilter(e.target.value)}
        />
        <div className="search-bar-wrapper">
          <input
            type="text"
            placeholder="Pesquisar por SKU..."
            value={skuFilter}
            onChange={e => setSkuFilter(e.target.value)}
          />
          <button
            type="button"
            className="camera-button"
            onClick={() => setIsScannerOpen(true)}
            title="Escanear código de barras"
          >
            <span className="icon">qr_code_scanner</span>
          </button>
        </div>
        <input
          type="text"
          placeholder="Pesquisar por Retirante..."
          value={userFilter}
          onChange={e => setUserFilter(e.target.value)}
        />
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Registro Nº</th>
              <th>Data</th>
              <th>Produto</th>
              <th>SKU</th>
              <th>Qtde. Saída</th>
              <th>Qtde. Estornada</th>
              <th>Local Original</th>
              <th>Retirado por</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length > 0 ? (
              filteredHistory.map(entry => {
                const statusInfo = {
                  text: 'Concluído',
                  className: 'active',
                  tooltip: '',
                };

                if (
                  entry.status === 'reversed' ||
                  entry.status === 'partially_reversed'
                ) {
                  statusInfo.text =
                    entry.status === 'reversed'
                      ? 'Estorno Total'
                      : 'Estorno Parcial';
                  statusInfo.className =
                    entry.status === 'reversed'
                      ? 'reversed'
                      : 'partially-reversed';

                  if (entry.reversalHistory && entry.reversalHistory.length > 0) {
                    const tooltipContent = entry.reversalHistory
                      .map(
                        rev =>
                          `  - ${rev.quantity} unid. por ${
                            rev.username
                          } em ${new Date(rev.date).toLocaleString('pt-BR')}`
                      )
                      .reverse()
                      .join('\n');
                    statusInfo.tooltip = `Histórico de Estornos:\n${tooltipContent}`;
                  }
                }

                return (
                  <tr
                    key={entry.id}
                    className={
                      entry.status === 'reversed' ? 'reversed-entry' : ''
                    }
                  >
                    <td>
                      {entry.sequenceId?.toString().padStart(6, '0') || 'N/A'}
                    </td>
                    <td>{new Date(entry.date).toLocaleString('pt-BR')}</td>
                    <td>{entry.productName}</td>
                    <td>{entry.productSku}</td>
                    <td>{entry.quantity}</td>
                    <td>{entry.reversedQuantity || 0}</td>
                    <td>{entry.location}</td>
                    <td>{entry.withdrawnBy}</td>
                    <td>
                      <span
                        className={`status-badge ${statusInfo.className}`}
                        {...(statusInfo.tooltip && {
                          'data-tooltip': statusInfo.tooltip,
                        })}
                      >
                        {statusInfo.text}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">
                    <span className="icon">history_toggle_off</span>
                    <h3>Nenhum registro encontrado</h3>
                    <p>
                      Não há saídas de produtos registradas ou nenhum registro
                      corresponde aos seus filtros.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {isScannerOpen && (
        <BarcodeScannerModal
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={code => {
            setSkuFilter(code);
            setIsScannerOpen(false);
          }}
        />
      )}
    </div>
  );
}
