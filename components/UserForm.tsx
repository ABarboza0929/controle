/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import Modal from './Modal';
import { useAuthStore, UserData } from '../lib/state';

interface UserFormProps {
  onClose: () => void;
}

export default function UserForm({ onClose }: UserFormProps) {
  const [formData, setFormData] = useState<UserData>({
    username: '',
    password: '',
    role: 'user',
  });
  const [error, setError] = useState('');
  const addUser = useAuthStore(state => state.addUser);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.username || !formData.password) {
      setError('Nome de usuário e senha são obrigatórios.');
      return;
    }
    if (formData.password.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }
    const success = addUser(formData);
    if (success) {
      onClose();
    } else {
      setError('Este nome de usuário já existe.');
    }
  };

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit} className="form-container">
        <div className="modal-header">
          <h2>Adicionar Novo Usuário</h2>
          <button type="button" onClick={onClose} className="modalClose">
            <span className="icon">close</span>
          </button>
        </div>
        <div className="modalContent">
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="username">Nome de Usuário</label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>
            <div className="form-field">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="role">Nível de Acesso</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="role-select"
              >
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            {error && (
              <p
                className="error-message"
                style={{ marginTop: '16px', marginBottom: 0 }}
              >
                {error}
              </p>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="primary">
            Salvar Usuário
          </button>
        </div>
      </form>
    </Modal>
  );
}
