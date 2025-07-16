/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { useAuthStore, useInventoryStore, Product } from '../lib/state';
import ExportModal, { SortOption } from './ExportModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type ModalState =
  | { type: 'NONE' }
  | { type: 'EDIT_PRODUCT'; product: Product }
  | { type: 'ADD_STOCK'; product: Product }
  | { type: 'MOVE_PRODUCT'; product: Product };

interface MinimumStockListProps {
  setModalState: (state: ModalState) => void;
}

export default function MinimumStockList({
  setModalState,
}: MinimumStockListProps) {
  const products = useInventoryStore(state => state.products);
  const { currentUser } = useAuthStore();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Filter for products at or below minimum stock, and where a minimum is set.
  const lowStockProducts = products
    .filter(p => p.minStock && p.minStock > 0 && p.quantity <= p.minStock)
    .sort((a, b) => {
      // Sort by severity: percentage of stock remaining. Lower is more severe.
      const severityA = a.quantity / (a.minStock || 1);
      const severityB = b.quantity / (b.minStock || 1);
      return severityA - severityB;
    });

  const exportSortOptions: SortOption[] = [
    { value: 'name', label: 'Ordem Alfabética (A-Z)' },
    { value: 'category', label: 'Grupo (Categoria)' },
  ];

  const handleExport = (format: 'pdf' | 'csv' | 'xlsx', sortBy: string) => {
    let sortedProducts = [...lowStockProducts];

    // Sort data
    sortedProducts.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'category') {
        return (a.category || '').localeCompare(b.category || '');
      }
      return 0;
    });

    const dataToExport = sortedProducts.map(p => ({
      SKU: p.id,
      Nome: p.name,
      Categoria: p.category || 'N/A',
      'Est. Atual': p.quantity,
      'Est. Mínimo': p.minStock || 0,
      'Est. Máximo': p.maxStock || 0,
      'Qtde. Necessária': Math.max(0, (p.maxStock || 0) - p.quantity),
      Localização: p.location,
    }));

    const filename = `relatorio_estoque_minimo_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'csv' || format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      if (format === 'csv') {
        const csvOutput = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([`\uFEFF${csvOutput}`], {
          type: 'text/csv;charset=utf-8;',
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // xlsx
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Estoque Mínimo');
        XLSX.writeFile(wb, `${filename}.xlsx`);
      }
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text('Relatório de Estoque Mínimo', 14, 16);
      autoTable(doc, {
        head: [Object.keys(dataToExport[0])],
        body: dataToExport.map(row => Object.values(row)),
        startY: 20,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [25, 118, 210] },
      });
      doc.save(`${filename}.pdf`);
    }
  };

  const getRowClass = (product: Product): string => {
    if (product.quantity <= 0) {
      return 'zero-stock-alert';
    }
    // All products on this page are by definition low on stock
    return 'low-stock-warning';
  };

  const getStockStatusIcon = (product: Product) => {
    if (product.quantity <= 0) {
      return (
        <span
          className="icon"
          title="Estoque zerado!"
          style={{
            color: 'var(--error-color)',
            marginLeft: '8px',
            verticalAlign: 'middle',
          }}
        >
          error
        </span>
      );
    }
    return (
      <span
        className="icon"
        title="Estoque baixo"
        style={{
          color: 'var(--warning-color)',
          marginLeft: '8px',
          verticalAlign: 'middle',
        }}
      >
        warning
      </span>
    );
  };

  return (
    <div className="product-list">
      <div className="product-list-header">
        <h2>Alerta de Estoque Mínimo</h2>
        <button
          className="secondary"
          onClick={() => setIsExportModalOpen(true)}
          disabled={lowStockProducts.length === 0}
        >
          <span className="icon">download</span>
          Exportar
        </button>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>SKU</th>
              <th>Qtde. / Mínimo</th>
              <th>Qtde. Máximo</th>
              <th>Qtde. Necessária</th>
              <th>Localização</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map(product => {
                const neededQuantity = Math.max(
                  0,
                  (product.maxStock || 0) - product.quantity
                );
                return (
                  <tr key={product.id} className={getRowClass(product)}>
                    <td>
                      <strong>{product.name}</strong>
                      <br />
                      <small>{product.description}</small>
                    </td>
                    <td>{product.id}</td>
                    <td>
                      {product.quantity} / {product.minStock}
                      {getStockStatusIcon(product)}
                    </td>
                    <td>{product.maxStock || 'N/A'}</td>
                    <td>{neededQuantity > 0 ? neededQuantity : '—'}</td>
                    <td>{product.location}</td>
                    <td className="actions-cell">
                      {currentUser?.role === 'admin' && (
                        <>
                          <button
                            className="secondary"
                            onClick={() =>
                              setModalState({ type: 'ADD_STOCK', product })
                            }
                            title="Adicionar Estoque"
                          >
                            <span className="icon">add_shopping_cart</span>
                          </button>
                          <button
                            className="secondary"
                            onClick={() =>
                              setModalState({ type: 'EDIT_PRODUCT', product })
                            }
                            title="Editar Produto (ajustar est. mínimo/máximo)"
                          >
                            <span className="icon">edit</span>
                          </button>
                        </>
                      )}
                      <button
                        className="secondary"
                        onClick={() =>
                          setModalState({ type: 'MOVE_PRODUCT', product })
                        }
                        title="Movimentar Produto"
                      >
                        <span className="icon">open_with</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <span
                      className="icon"
                      style={{ color: 'var(--success-color)' }}
                    >
                      check_circle
                    </span>
                    <h3>Tudo em ordem!</h3>
                    <p>Nenhum produto está abaixo do estoque mínimo.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {isExportModalOpen && (
        <ExportModal
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExport}
          sortOptions={exportSortOptions}
        />
      )}
    </div>
  );
}
