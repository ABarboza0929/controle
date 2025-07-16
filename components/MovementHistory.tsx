/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useMemo } from 'react';
import { useInventoryStore, Product } from '../lib/state';
import BarcodeScannerModal from './BarcodeScannerModal';

type MovementType =
  | 'Todos'
  | 'Saída'
  | 'Entrada'
  | 'Ajuste'
  | 'Estorno'
  | 'Criação'
  | 'Movimentação';

interface UnifiedMovement {
  key: string;
  date: string;
  type: MovementType;
  productName: string;
  productSku: string;
  quantity: number;
  systemUser: string;
  withdrawnBy: string;
  category: string;
  supplier: string;
  details: string;
}

export default function MovementHistory() {
  const products = useInventoryStore(state => state.products);
  const checkoutHistory = useInventoryStore(state => state.checkoutHistory);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [skuFilter, setSkuFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<MovementType>('Todos');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const unifiedHistory = useMemo(() => {
    const movements: UnifiedMovement[] = [];
    const productMap = new Map<string, Product>(products.map(p => [p.id, p]));

    checkoutHistory.forEach(entry => {
      const product = productMap.get(entry.productId);
      movements.push({
        key: `checkout-${entry.id}`,
        date: entry.date,
        type: 'Saída' as MovementType,
        productName: entry.productName,
        productSku: entry.productSku,
        quantity: entry.quantity,
        systemUser: entry.systemUser,
        withdrawnBy: entry.withdrawnBy,
        category: product?.category || '',
        supplier: product?.supplier || '',
        details: `Reg. Saída: ${entry.sequenceId
          .toString()
          .padStart(6, '0')}`,
      });

      if (entry.reversalHistory) {
        entry.reversalHistory.forEach((reversal, index) => {
          movements.push({
            key: `reversal-${entry.id}-${index}`,
            date: reversal.date,
            type: 'Estorno' as MovementType,
            productName: entry.productName,
            productSku: entry.productSku,
            quantity: reversal.quantity,
            systemUser: reversal.username,
            withdrawnBy: '',
            category: product?.category || '',
            supplier: product?.supplier || '',
            details: `Ref. Saída: ${entry.sequenceId
              .toString()
              .padStart(6, '0')}`,
          });
        });
      }
    });

    products.forEach(product => {
      product.history.forEach((histEntry, index) => {
        if (histEntry.type === 'saída' || histEntry.type === 'estorno') return;

        const quantity = histEntry.quantityAffected || 0;
        const user = histEntry.responsibleUser || 'N/A';

        const type = (histEntry.type.charAt(0).toUpperCase() +
          histEntry.type.slice(1)) as MovementType;

        movements.push({
          key: `product-${product.id}-hist-${index}`,
          date: histEntry.date,
          type: type,
          productName: product.name,
          productSku: product.id,
          quantity: quantity,
          systemUser: user,
          withdrawnBy: '',
          category: product.category || '',
          supplier: product.supplier || '',
          details: histEntry.description,
        });
      });
    });

    return movements.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [products, checkoutHistory]);

  const filteredHistory = useMemo(() => {
    return unifiedHistory.filter(entry => {
      const entryDate = new Date(entry.date);
      // Adjust start date to be the beginning of the day and end date to be the end of the day
      const filterStartDate = startDate ? new Date(startDate) : null;
      if (filterStartDate) filterStartDate.setHours(0, 0, 0, 0);

      const filterEndDate = endDate ? new Date(endDate) : null;
      if (filterEndDate) filterEndDate.setHours(23, 59, 59, 999);

      const matchesDate =
        (!filterStartDate || entryDate >= filterStartDate) &&
        (!filterEndDate || entryDate <= filterEndDate);
      const matchesProduct =
        !productFilter ||
        entry.productName.toLowerCase().includes(productFilter.toLowerCase());
      const matchesSku =
        !skuFilter ||
        entry.productSku.toLowerCase().includes(skuFilter.toLowerCase());
      const matchesCategory =
        !categoryFilter ||
        (entry.category &&
          entry.category.toLowerCase().includes(categoryFilter.toLowerCase()));
      const matchesSupplier =
        !supplierFilter ||
        (entry.supplier &&
          entry.supplier.toLowerCase().includes(supplierFilter.toLowerCase()));
      const matchesUser =
        !userFilter ||
        entry.systemUser.toLowerCase().includes(userFilter.toLowerCase());
      const matchesType = typeFilter === 'Todos' || entry.type === typeFilter;

      return (
        matchesDate &&
        matchesProduct &&
        matchesSku &&
        matchesCategory &&
        matchesSupplier &&
        matchesUser &&
        matchesType
      );
    });
  }, [
    unifiedHistory,
    startDate,
    endDate,
    productFilter,
    skuFilter,
    categoryFilter,
    supplierFilter,
    userFilter,
    typeFilter,
  ]);

  return (
    <div className="product-list">
      <div className="product-list-header">
        <h2>Relatório de Movimentação por Período</h2>
      </div>
      <div className="history-filter-bar">
        <div className="filter-item">
          <label>Data Inicial</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>
        <div className="filter-item">
          <label>Data Final</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
        <div className="filter-item">
          <label>Tipo</label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as MovementType)}
          >
            <option value="Todos">Todos os Tipos</option>
            <option value="Entrada">Entrada</option>
            <option value="Saída">Saída</option>
            <option value="Ajuste">Ajuste</option>
            <option value="Estorno">Estorno</option>
            <option value="Criação">Criação</option>
            <option value="Movimentação">Movimentação</option>
          </select>
        </div>
        <div className="filter-item">
          <label>Produto</label>
          <input
            type="text"
            placeholder="Filtrar por Produto..."
            value={productFilter}
            onChange={e => setProductFilter(e.target.value)}
          />
        </div>
        <div className="filter-item">
          <label>SKU</label>
          <div className="search-bar-wrapper">
            <input
              type="text"
              placeholder="Filtrar por SKU..."
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
        </div>
        <div className="filter-item">
          <label>Categoria</label>
          <input
            type="text"
            placeholder="Filtrar por Categoria..."
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          />
        </div>
        <div className="filter-item">
          <label>Fornecedor</label>
          <input
            type="text"
            placeholder="Filtrar por Fornecedor..."
            value={supplierFilter}
            onChange={e => setSupplierFilter(e.target.value)}
          />
        </div>
        <div className="filter-item">
          <label>Usuário</label>
          <input
            type="text"
            placeholder="Filtrar por Usuário..."
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
          />
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Produto/SKU</th>
              <th>Quantidade</th>
              <th>Usuário (Sistema)</th>
              <th>Retirado por</th>
              <th>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length > 0 ? (
              filteredHistory.map(entry => (
                <tr key={entry.key}>
                  <td>{new Date(entry.date).toLocaleString('pt-BR')}</td>
                  <td>{entry.type}</td>
                  <td>
                    <strong>{entry.productName}</strong>
                    <br />
                    <small>{entry.productSku}</small>
                  </td>
                  <td>{entry.quantity || '-'}</td>
                  <td>{entry.systemUser}</td>
                  <td>{entry.withdrawnBy || 'N/A'}</td>
                  <td style={{ whiteSpace: 'normal', maxWidth: '300px' }}>
                    {entry.details}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <span className="icon">history_toggle_off</span>
                    <h3>Nenhum registro encontrado</h3>
                    <p>
                      Não há movimentações registradas ou nenhum registro
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
