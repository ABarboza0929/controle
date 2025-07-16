/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { usePartnerStore, Partner } from '../lib/state';
import { ModalState } from '../App';

interface PartnersProps {
  setModalState: (state: ModalState) => void;
}

export default function Partners({ setModalState }: PartnersProps) {
  const { partners, deletePartner } = usePartnerStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPartners = partners.filter(
    partner =>
      partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (partner.contactName &&
        partner.contactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (partner.taxId && partner.taxId.includes(searchTerm))
  );

  const handleDelete = (id: string, name: string) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir "${name}"? Esta ação não pode ser desfeita.`
      )
    ) {
      deletePartner(id);
    }
  };

  const formatType = (type: 'cliente' | 'fornecedor' | 'ambos') => {
    switch (type) {
      case 'cliente':
        return 'Cliente';
      case 'fornecedor':
        return 'Fornecedor';
      case 'ambos':
        return 'Cliente e Fornecedor';
    }
  };

  return (
    <div className="product-list">
      <div className="product-list-header">
        <h2>Clientes & Fornecedores</h2>
        <div className="header-actions">
          <div className="search-bar">
            <span className="icon">search</span>
            <input
              type="text"
              placeholder="Pesquisar por nome, contato ou CNPJ/CPF..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="primary"
            onClick={() => setModalState({ type: 'ADD_PARTNER' })}
          >
            <span className="icon">add</span>
            Adicionar Contato
          </button>
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nome / Razão Social</th>
              <th>Tipo</th>
              <th>CNPJ / CPF</th>
              <th>Contato (Telefone / E-mail)</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredPartners.length > 0 ? (
              filteredPartners.map(partner => (
                <tr key={partner.id}>
                  <td>
                    <strong>{partner.name}</strong>
                    <br />
                    <small>{partner.contactName || 'N/A'}</small>
                  </td>
                  <td>{formatType(partner.type)}</td>
                  <td>{partner.taxId || 'N/A'}</td>
                  <td>
                    {partner.phone || 'N/A'}
                    <br />
                    <small>{partner.email || 'N/A'}</small>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="secondary"
                      onClick={() =>
                        setModalState({ type: 'EDIT_PARTNER', partner })
                      }
                      title="Editar Contato"
                    >
                      <span className="icon">edit</span>
                    </button>
                    <button
                      className="danger"
                      onClick={() => handleDelete(partner.id, partner.name)}
                      title="Excluir Contato"
                    >
                      <span className="icon">delete</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <span className="icon">contacts</span>
                    <h3>Nenhum cliente ou fornecedor encontrado</h3>
                    <p>
                      Clique em "Adicionar Contato" para começar a cadastrar.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}