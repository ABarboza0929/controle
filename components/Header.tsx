/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useAuthStore } from '../lib/state';

export default function Header() {
  const { currentUser, logout } = useAuthStore();

  return (
    <header>
      <h1>
        <span className="icon" style={{ marginRight: '12px' }}>
          warehouse
        </span>
        Gestão de Almoxarifado
      </h1>
      {currentUser && (
        <div className="header-user-info">
          <div className="user-details">
            <span className="user-name">{currentUser.username}</span>
            <span className="user-role">{currentUser.role}</span>
          </div>
          <button onClick={logout} className="secondary logout-button">
            <span className="icon">logout</span>
            Sair
          </button>
        </div>
      )}
    </header>
  );
}
