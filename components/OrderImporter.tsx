/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { useOrderStore, Order, OrderData } from '../lib/state';
import { ModalState } from '../App';

interface OrderImporterProps {
  setModalState: (state: ModalState) => void;
}

const API_KEY = process.env.API_KEY as string;

const orderSchema = {
  type: Type.OBJECT,
  properties: {
    orderNumber: {
      type: Type.STRING,
      description: 'Número do pedido de compra.',
    },
    issueDate: {
      type: Type.STRING,
      description: 'Data de emissão no formato AAAA-MM-DD.',
    },
    supplierName: { type: Type.STRING, description: 'Nome do fornecedor.' },
    supplierTaxId: { type: Type.STRING, description: 'CNPJ do fornecedor.' },
    items: {
      type: Type.ARRAY,
      description: 'Lista de itens do pedido.',
      items: {
        type: Type.OBJECT,
        properties: {
          supplierCode: {
            type: Type.STRING,
            description: 'Código do item no fornecedor.',
          },
          description: { type: Type.STRING, description: 'Descrição do item.' },
          quantity: { type: Type.NUMBER, description: 'Quantidade do item.' },
          unitPrice: {
            type: Type.NUMBER,
            description: 'Preço unitário do item.',
          },
          totalPrice: {
            type: Type.NUMBER,
            description: 'Preço total do item.',
          },
        },
        required: ['description', 'quantity', 'unitPrice', 'totalPrice'],
      },
    },
    totalAmount: { type: Type.NUMBER, description: 'Valor total do pedido.' },
    costCenter: {
      type: Type.STRING,
      description: 'Centro de custo sugerido.',
    },
    paymentTerms: {
      type: Type.STRING,
      description: 'Condição de pagamento sugerida.',
    },
    deliveryDate: {
      type: Type.STRING,
      description: 'Data de entrega prevista (AAAA-MM-DD).',
    },
    status: { type: Type.STRING, description: 'Status inicial do pedido.' },
    requester: {
      type: Type.STRING,
      description: 'Nome do solicitante sugerido.',
    },
  },
  required: ['orderNumber', 'issueDate', 'supplierName', 'items', 'totalAmount'],
};

export default function OrderImporter({ setModalState }: OrderImporterProps) {
  const { orders } = useOrderStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!API_KEY) {
      setError('A chave da API Gemini não está configurada.');
      return;
    }

    setError('');
    setIsProcessing(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = (reader.result as string).split(',')[1];
      try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const imagePart = {
          inlineData: { mimeType: file.type, data: base64Image },
        };
        const textPart = {
          text: 'Analise a imagem deste pedido de compra e extraia os dados estruturados conforme o schema JSON. Enriqueça os dados quando necessário.',
        };

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [textPart, imagePart] },
          config: {
            responseMimeType: 'application/json',
            responseSchema: orderSchema,
          },
        });

        const parsedData = JSON.parse(response.text) as OrderData;
        setModalState({
          type: 'ORDER_REVIEW',
          orderData: parsedData,
          imageBase64: base64Image,
        });
      } catch (err: any) {
        console.error('AI analysis failed:', err);
        setError(
          `Falha na análise da IA: ${
            err.message || 'Erro desconhecido.'
          } Verifique o console.`
        );
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset file input
        }
      }
    };
    reader.onerror = () => {
      setError('Falha ao ler o arquivo.');
      setIsProcessing(false);
    };
  };

  const filteredOrders = orders.filter(
    order =>
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="product-list">
      <div
        className="product-list-header"
        style={{
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '16px',
        }}
      >
        <h2>Importar Pedido de Compra com IA</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
          Envie a foto de um pedido de compra para que a IA extraia e organize
          as informações para você.
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
          id="order-upload-input"
          disabled={isProcessing}
        />
        <button
          className="primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <span className="icon spinner">progress_activity</span>
              Analisando...
            </>
          ) : (
            <>
              <span className="icon">upload_file</span>
              Escolher Foto do Pedido
            </>
          )}
        </button>
        {error && (
          <p
            className="error-message"
            style={{ width: '100%', textAlign: 'left' }}
          >
            {error}
          </p>
        )}
      </div>

      <div
        className="product-list-header"
        style={{ borderTop: '1px solid var(--border-color)', marginTop: '24px' }}
      >
        <h2>Histórico de Pedidos Importados</h2>
        <div className="header-actions">
          <div className="search-bar">
            <span className="icon">search</span>
            <input
              type="text"
              placeholder="Pesquisar por Nº do Pedido ou Fornecedor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Importado em</th>
              <th>Nº Pedido</th>
              <th>Fornecedor</th>
              <th>Valor Total</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>{new Date(order.importedAt).toLocaleString('pt-BR')}</td>
                  <td>{order.orderNumber}</td>
                  <td>{order.supplierName}</td>
                  <td>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(order.totalAmount)}
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: '#0288d1', color: 'white' }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="secondary"
                      onClick={() =>
                        setModalState({ type: 'ORDER_DETAIL', order })
                      }
                    >
                      <span className="icon">visibility</span>
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <span className="icon">history</span>
                    <h3>Nenhum pedido importado</h3>
                    <p>Use a função acima para importar o seu primeiro pedido.</p>
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