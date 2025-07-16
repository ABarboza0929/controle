/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { useInventoryStore, Product } from '../lib/state';
import BarcodeScannerModal from './BarcodeScannerModal';

type ModalState =
  | { type: 'NONE' }
  | { type: 'CHECKOUT_STOCK'; product: Product }
  | { type: 'REVERSE_CHECKOUT' };

interface StockCheckoutProps {
  setModalState: (state: ModalState) => void;
}

export default function StockCheckout({ setModalState }: StockCheckoutProps) {
  const products = useInventoryStore(state => state.products);
  const [searchTerm, setSearchTerm] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const filteredProducts = products.filter(
    product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="product-list">
      <div className="product-list-header">
        <h2>Movimentação de Saída</h2>
        <div className="header-actions">
          <div className="search-bar">
            <span className="icon">search</span>
            <input
              type="text"
              placeholder="Pesquisar por Produto ou SKU..."
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
            onClick={() => setModalState({ type: 'REVERSE_CHECKOUT' })}
            title="Estornar uma Saída"
          >
            <span className="icon">undo</span>
            Estornar Saída
          </button>
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>SKU</th>
              <th>Qtde. Atual</th>
              <th>Localização</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                    <br />
                    <small>{product.description}</small>
                  </td>
                  <td>{product.id}</td>
                  <td>{product.quantity}</td>
                  <td>{product.location}</td>
                  <td className="actions-cell">
                    <button
                      className="primary"
                      onClick={() =>
                        setModalState({ type: 'CHECKOUT_STOCK', product })
                      }
                      disabled={product.quantity <= 0}
                      title="Registrar Saída"
                    >
                      <span className="icon">arrow_upward</span>
                      Registrar Saída
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    {searchTerm ? (
                      <>
                        <span className="icon">search_off</span>
                        <h3>Nenhum produto encontrado</h3>
                        <p>
                          A sua pesquisa por "{searchTerm}" não encontrou nenhum
                          produto.
                        </p>
                      </>
                    ) : (
                      <>
                        <span className="icon">inventory_2</span>
                        <h3>Nenhum produto em estoque</h3>
                        <p>
                          Adicione produtos na tela de estoque para poder
                          movimentá-los.
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
    </div>
  );
}
