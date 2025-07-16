/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { useAuthStore } from '../lib/state';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore(state => state.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const loginStatus = login(username, password);
    if (loginStatus === 'invalid_credentials') {
      setError('Usuário ou senha inválidos.');
    } else if (loginStatus === 'user_blocked') {
      setError('Erro: Procure o setor de TI.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div>
          <div className="login-header">
            <h1>Bem-vindo</h1>
            <p>Faça login para acessar o sistema.</p>
          </div>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-field">
              <label htmlFor="login-username">Usuário</label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-field">
              <label htmlFor="login-password">Senha</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="primary">
              Entrar
            </button>
          </form>
          <button
            type="button"
            className="form-toggle"
            onClick={() =>
              alert('Funcionalidade de recuperação de senha não implementada.')
            }
          >
            Esqueci a senha
          </button>
        </div>
      </div>
    </div>
  );
}
