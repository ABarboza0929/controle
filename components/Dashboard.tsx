/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useInventoryStore } from '../lib/state';
import c from 'classnames';

type ReportView = 'dashboard' | 'valuation' | 'minimumStock';
interface DashboardProps {
  setReportView: (view: ReportView) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function Dashboard({ setReportView }: DashboardProps) {
  const products = useInventoryStore(state => state.products);

  const totalValue = products.reduce(
    (sum, p) => sum + (p.cost || 0) * p.quantity,
    0
  );
  const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
  const skuCount = products.length;
  const lowStockProducts = products.filter(
    p => p.minStock && p.minStock > 0 && p.quantity <= p.minStock
  );
  const lowStockCount = lowStockProducts.length;

  return (
    <div>
      <div
        className="product-list-header"
        style={{ borderBottom: 'none', padding: '0 0 24px 0' }}
      >
        <h2>Dashboard Gerencial</h2>
      </div>
      <div className="dashboard-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-icon icon">account_balance_wallet</span>
            <h3 className="kpi-card-title">Valor Total em Estoque</h3>
          </div>
          <p className="kpi-card-value">{formatCurrency(totalValue)}</p>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-icon icon">inventory_2</span>
            <h3 className="kpi-card-title">Itens em Estoque</h3>
          </div>
          <p className="kpi-card-value">{totalItems.toLocaleString('pt-BR')}</p>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-icon icon">qr_code_2</span>
            <h3 className="kpi-card-title">SKUs Cadastrados</h3>
          </div>
          <p className="kpi-card-value">{skuCount}</p>
        </div>

        <div className={c('kpi-card', { alert: lowStockCount > 0 })}>
          <div className="kpi-card-header">
            <span className="kpi-card-icon icon">notification_important</span>
            <h3 className="kpi-card-title">Alertas de Estoque</h3>
          </div>
          <p className="kpi-card-value">{lowStockCount}</p>
          <button
            className="kpi-card-link"
            onClick={() => setReportView('minimumStock')}
          >
            Ver produtos com estoque baixo
            <span
              className="icon"
              style={{
                marginLeft: '4px',
                fontSize: '18px',
                verticalAlign: 'middle',
              }}
            >
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
