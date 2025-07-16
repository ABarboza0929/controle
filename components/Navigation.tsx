/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import c from 'classnames';
import { useAuthStore } from '../lib/state';

type ViewState = 'stock' | 'checkout' | 'users' | 'reports';

interface NavigationProps {
  view: ViewState;
  setView: (view: ViewState) => void;
}

export default function Navigation({ view, setView }: NavigationProps) {
  const { currentUser } = useAuthStore();

  return (
    <nav className="main-nav">
      <button
        className={c({ active: view === 'stock' })}
        onClick={() => setView('stock')}
      >
        <span className="icon">inventory</span>
        Produtos em Estoque
      </button>
      <button
        className={c({ active: view === 'checkout' })}
        onClick={() => setView('checkout')}
      >
        <span className="icon">move_to_inbox</span>
        Movimentação de Saída
      </button>
      {currentUser?.role === 'admin' && (
        <>
          <button
            className={c({ active: view === 'reports' })}
            onClick={() => setView('reports')}
          >
            <span className="icon">assessment</span>
            Relatórios Gerenciais
          </button>
          <button
            className={c({ active: view === 'users' })}
            onClick={() => setView('users')}
          >
            <span className="icon">manage_accounts</span>
            Gerenciar Usuários
          </button>
        </>
      )}
    </nav>
  );
}
