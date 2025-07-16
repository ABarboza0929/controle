/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useAuthStore, UserRole } from '../lib/state';

interface UserManagementProps {
  setModalState: (state: { type: 'ADD_USER' }) => void;
}

export default function UserManagement({ setModalState }: UserManagementProps) {
  const { users, currentUser, updateUserRole, toggleUserBlock } =
    useAuthStore();

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    updateUserRole(userId, newRole);
  };

  const handleToggleBlock = (userId: string) => {
    toggleUserBlock(userId);
  };

  return (
    <div className="product-list">
      <div className="product-list-header">
        <h2>Gerenciar Usuários</h2>
        <button
          className="primary"
          onClick={() => setModalState({ type: 'ADD_USER' })}
        >
          <span className="icon">person_add</span>
          Adicionar Usuário
        </button>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Nível de Acesso</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>
                  <select
                    className="role-select"
                    value={user.role}
                    onChange={e =>
                      handleRoleChange(user.id, e.target.value as UserRole)
                    }
                    disabled={user.id === currentUser?.id}
                  >
                    <option value="user">Usuário</option>
                    <option value="admin">Administrador</option>
                  </select>
                </td>
                <td className="actions-cell">
                  <button
                    className={user.isBlocked ? 'secondary' : 'danger'}
                    onClick={() => handleToggleBlock(user.id)}
                    disabled={user.id === currentUser?.id}
                    title={
                      user.isBlocked ? 'Desbloquear Usuário' : 'Bloquear Usuário'
                    }
                  >
                    <span className="icon">
                      {user.isBlocked ? 'lock_open' : 'lock'}
                    </span>
                    {user.isBlocked ? 'Desbloquear' : 'Bloquear'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
