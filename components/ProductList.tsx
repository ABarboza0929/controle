/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { useAuthStore, useInventoryStore, Product } from '../lib/state';
import BarcodeScannerModal from './BarcodeScannerModal';
import ExportModal, { SortOption } from './ExportModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type ModalState =
  | { type: 'NONE' }
  | { type: 'ADD_PRODUCT' }
  | { type: 'EDIT_PRODUCT'; product: Product }
  | { type: 'ADD_STOCK'; product: Product }
  | { type: 'MOVE_PRODUCT'; product: Product };

interface ProductListProps {
  setModalState: (state: ModalState) => void;
  setPrintModalProduct: (product: Product) => void;
}

export default function ProductList({
  setModalState,
  setPrintModalProduct,
}: ProductListProps) {
  const products = useInventoryStore(state => state.products);
  const { currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const exportSortOptions: SortOption[] = [
    { value: 'name', label: 'Nome do Produto (A-Z)' },
    { value: 'location', label: 'Localização' },
    { value: 'category', label: 'Categoria' },
  ];

  const handleExport = (format: 'pdf' | 'csv' | 'xlsx', sortBy: string) => {
    let sortedProducts = [...products];

    // Sort data
    sortedProducts.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'location') {
        return (a.location || '').localeCompare(b.location || '');
      }
      if (sortBy === 'category') {
        return (a.category || '').localeCompare(b.category || '');
      }
      return 0;
    });

    const dataToExport = sortedProducts.map(p => ({
      SKU: p.id,
      Nome: p.name,
      Descrição: p.description,
      Quantidade: p.quantity,
      'Est. Mínimo': p.minStock || 0,
      'Est. Máximo': p.maxStock || 0,
      'Un. Medida': p.unitOfMeasure || 'un',
      Localização: p.location,
      Categoria: p.category || 'N/A',
      Fornecedor: p.supplier || 'N/A',
      'Custo (R$)': p.cost || 0,
    }));

    const filename = `relatorio_estoque_${new Date().toISOString().slice(0, 10)}`;

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
        XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
        XLSX.writeFile(wb, `${filename}.xlsx`);
      }
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text('Relatório de Estoque', 14, 16);
      autoTable(doc, {
        head: [Object.keys(dataToExport[0])],
        body: dataToExport.map(row => Object.values(row)),
        startY: 20,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [25, 118, 210] }, // --primary-color
      });
      doc.save(`${filename}.pdf`);
    }
  };

  const filteredProducts = products.filter(
    product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRowClass = (product: Product): string => {
    if (!product.minStock || product.minStock <= 0) {
      return '';
    }
    if (product.quantity <= 0) {
      return 'zero-stock-alert';
    }
    if (product.quantity <= product.minStock) {
      return 'low-stock-warning';
    }
    return '';
  };

  const getStockStatusIcon = (product: Product) => {
    if (!product.minStock || product.minStock <= 0) {
      return null;
    }
    if (product.quantity <= 0) {
      return (
        <span
          className="icon"
          title="Estoque zerado"
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
    if (product.quantity <= product.minStock) {
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
    }
    return null;
  };

  return (
    <div className="product-list">
      <div className="product-list-header">
        <h2>Produtos em Estoque</h2>
        <div className="header-actions">
          <div className="search-bar">
            <span className="icon">search</span>
            <input
              type="text"
              placeholder="Pesquisar por SKU ou descrição..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
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
          <button
            className="secondary"
            onClick={() => setIsExportModalOpen(true)}
          >
            <span className="icon">download</span>
            Exportar
          </button>
          {currentUser?.role === 'admin' && (
            <button
              className="primary"
              onClick={() => setModalState({ type: 'ADD_PRODUCT' })}
            >
              <span className="icon">add</span>
              Adicionar Produto
            </button>
          )}
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>SKU</th>
              <th>Quantidade</th>
              <th>Est. Mínimo</th>
              <th>Localização</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => {
                return (
                  <tr key={product.id} className={getRowClass(product)}>
                    <td>
                      <strong>{product.name}</strong>
                      <br />
                      <small>{product.description}</small>
                    </td>
                    <td>{product.id}</td>
                    <td>
                      {product.quantity}
                      {getStockStatusIcon(product)}
                    </td>
                    <td>{product.minStock || 0}</td>
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
                            title="Editar Produto"
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
                      <button
                        className="secondary"
                        onClick={() => setPrintModalProduct(product)}
                        title="Imprimir Etiqueta"
                      >
                        <span className="icon">print</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    {searchTerm ? (
                      <>
                        <span className="icon">search_off</span>
                        <h3>Nenhum produto encontrado</h3>
                        <p>
                          A sua pesquisa por "{searchTerm}" não encontrou nenhum
                          resultado.
                        </p>
                      </>
                    ) : (
                      <>
                        <span className="icon">inventory_2</span>
                        <h3>Nenhum produto encontrado</h3>
                        <p>
                          {currentUser?.role === 'admin'
                            ? 'Clique em "Adicionar Produto" para começar a cadastrar.'
                            : 'Peça a um administrador para adicionar produtos.'}
                        </p>
                      </>
                    )}
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
            setSearchTerm(code);
            setIsScannerOpen(false);
          }}
        />
      )}
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
