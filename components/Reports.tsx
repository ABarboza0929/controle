/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import c from 'classnames';
import { ViewState, ModalState } from '../App';
import Dashboard from './Dashboard';
import InventoryValuation from './InventoryValuation';
import MinimumStockList from './MinimumStockList';
import MovementHistory from './MovementHistory';
import Partners from './Partners';
import OrderImporter from './OrderImporter';
import { Order, OrderData, Partner } from '../lib/state';

type ReportView =
  | 'dashboard'
  | 'valuation'
  | 'minimumStock'
  | 'movement'
  | 'partners'
  | 'orderImport';

interface ReportsProps {
  setView: (view: ViewState) => void;
  setModalState: (state: ModalState) => void;
}

export default function Reports({ setView, setModalState }: ReportsProps) {
  const [reportView, setReportView] = useState<ReportView>('dashboard');

  return (
    <div>
      <nav className="reports-sub-nav">
        <button
          className={c({ active: reportView === 'dashboard' })}
          onClick={() => setReportView('dashboard')}
        >
          <span className="icon">dashboard</span>
          Dashboard
        </button>
        <button
          className={c({ active: reportView === 'valuation' })}
          onClick={() => setReportView('valuation')}
        >
          <span className="icon">monetization_on</span>
          Valor do Estoque
        </button>
        <button
          className={c({ active: reportView === 'minimumStock' })}
          onClick={() => setReportView('minimumStock')}
        >
          <span className="icon">notification_important</span>
          Estoque Mínimo
        </button>
        <button
          className={c({ active: reportView === 'movement' })}
          onClick={() => setReportView('movement')}
        >
          <span className="icon">history</span>
          Movimentação por Período
        </button>
        <button
          className={c({ active: reportView === 'partners' })}
          onClick={() => setReportView('partners')}
        >
          <span className="icon">contacts</span>
          Clientes & Fornecedores
        </button>
        <button
          className={c({ active: reportView === 'orderImport' })}
          onClick={() => setReportView('orderImport')}
        >
          <span className="icon">document_scanner</span>
          Importar Pedido com IA
        </button>
      </nav>

      {reportView === 'dashboard' && (
        <Dashboard setReportView={setReportView} />
      )}
      {reportView === 'valuation' && <InventoryValuation />}
      {reportView === 'minimumStock' && (
        <MinimumStockList setModalState={setModalState} />
      )}
      {reportView === 'movement' && <MovementHistory />}
      {reportView === 'partners' && <Partners setModalState={setModalState} />}
      {reportView === 'orderImport' && (
        <OrderImporter setModalState={setModalState} />
      )}
    </div>
  );
}
