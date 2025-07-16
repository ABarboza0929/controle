/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useInventoryStore } from '../lib/state';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function InventoryValuation() {
  const products = useInventoryStore(state => state.products);

  const grandTotal = products.reduce(
    (sum, p) => sum + (p.cost || 0) * p.quantity,
    0
  );

  return (
    <div className="product-list">
      <div className="product-list-header">
        <h2>Relatório de Valor do Estoque</h2>
      </div>
      <div className="table-wrapper">
        <table className="valuation-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>SKU</th>
              <th>Custo Unitário</th>
              <th>Quantidade</th>
              <th>Valor Total por Item</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map(product => {
                const itemTotalValue = (product.cost || 0) * product.quantity;
                return (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                      <br />
                      <small>{product.description}</small>
                    </td>
                    <td>{product.id}</td>
                    <td>{formatCurrency(product.cost || 0)}</td>
                    <td>{product.quantity}</td>
                    <td>{formatCurrency(itemTotalValue)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <span className="icon">inventory_2</span>
                    <h3>Nenhum produto cadastrado</h3>
                    <p>
                      Cadastre produtos e custos para ver a valoração do
                      estoque.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          {products.length > 0 && (
            <tfoot>
              <tr>
                <td
                  colSpan={4}
                  style={{ textAlign: 'right', paddingRight: '24px' }}
                >
                  <strong>Valor Total do Inventário:</strong>
                </td>
                <td>
                  <strong>{formatCurrency(grandTotal)}</strong>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
