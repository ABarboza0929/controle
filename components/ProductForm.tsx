/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import Modal from './Modal';
import { Product, ProductData, usePartnerStore } from '../lib/state';
import { GoogleGenAI } from '@google/genai';
import { createProductParserPrompt } from '../lib/prompts';

interface ProductFormProps {
  onClose: () => void;
  onSave: (product: ProductData) => void;
  title: string;
  productToEdit?: Product;
}

const API_KEY = process.env.API_KEY as string;

export default function ProductForm({
  onClose,
  onSave,
  title,
  productToEdit,
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductData>({
    id: '',
    name: '',
    description: '',
    quantity: 0,
    minStock: 0,
    maxStock: 0,
    location: '',
    supplier: '',
    category: '',
    unitOfMeasure: 'un',
    cost: 0,
  });
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const { partners } = usePartnerStore();
  const suppliers = partners.filter(
    p => p.type === 'fornecedor' || p.type === 'ambos'
  );

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        id: productToEdit.id,
        name: productToEdit.name,
        description: productToEdit.description,
        quantity: productToEdit.quantity,
        location: productToEdit.location,
        minStock: productToEdit.minStock || 0,
        maxStock: productToEdit.maxStock || 0,
        supplier: productToEdit.supplier || '',
        category: productToEdit.category || '',
        unitOfMeasure: productToEdit.unitOfMeasure || 'un',
        cost: productToEdit.cost || 0,
      });
    }
  }, [productToEdit]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'quantity' || name === 'minStock' || name === 'maxStock'
          ? parseInt(value, 10) || 0
          : name === 'cost'
          ? parseFloat(value.replace(',', '.')) || 0
          : value,
    }));
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt || !API_KEY) {
      setError('Por favor, digite uma descrição e configure a API Key.');
      return;
    }
    setIsGenerating(true);
    setError('');
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: createProductParserPrompt(aiPrompt),
        config: {
          responseMimeType: 'application/json',
        },
      });

      let jsonStr = response.text.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }

      const parsedData: Partial<ProductData> = JSON.parse(jsonStr);
      setFormData(prev => ({
        ...prev,
        ...parsedData,
      }));
    } catch (e: any) {
      console.error('Falha ao gerar dados com IA:', e);
      setError(
        'Não foi possível processar a sua solicitação. Verifique o console para mais detalhes.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.id) {
      setError('Nome do produto e SKU são obrigatórios.');
      return;
    }
    onSave(formData);
  };

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit} className="form-container">
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} className="modalClose">
            <span className="icon">close</span>
          </button>
        </div>
        <div className="modalContent">
          <div className="ai-section">
            <p>
              Digite os detalhes do produto e deixe a IA organizar para você.
            </p>
            <div className="ai-input-group">
              <input
                type="text"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="Ex: 100 camisetas G Nike, custo 25, cat: Vestuário..."
                disabled={isGenerating}
              />
              <button
                type="button"
                className="secondary"
                onClick={handleGenerateWithAI}
                disabled={isGenerating || !aiPrompt}
              >
                {isGenerating ? (
                  <span className="icon spinner">progress_activity</span>
                ) : (
                  <span className="icon">auto_awesome</span>
                )}
                Gerar
              </button>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-grid two-cols">
              <div className="form-field">
                <label htmlFor="name">Nome do Produto</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="id">SKU</label>
                <input
                  id="id"
                  name="id"
                  type="text"
                  value={formData.id}
                  onChange={handleChange}
                  required
                  readOnly={!!productToEdit}
                  style={
                    !!productToEdit
                      ? {
                          backgroundColor: '#f0f0f0',
                          cursor: 'not-allowed',
                        }
                      : {}
                  }
                />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="description">Descrição</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
            <div className="form-grid two-cols">
              <div className="form-field">
                <label htmlFor="category">Categoria (Grupo)</label>
                <input
                  id="category"
                  name="category"
                  type="text"
                  placeholder="Ex: Ferramentas"
                  value={formData.category}
                  onChange={handleChange}
                />
              </div>
              <div className="form-field">
                <label htmlFor="supplier">Fornecedor</label>
                <select
                  id="supplier"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                >
                  <option value="">Selecione um fornecedor</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-grid two-cols">
              <div className="form-field">
                <label htmlFor="quantity">
                  Quantidade {productToEdit ? 'Atual' : 'Inicial'}
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="0"
                  readOnly={!!productToEdit}
                  style={
                    !!productToEdit
                      ? {
                          backgroundColor: '#f0f0f0',
                          cursor: 'not-allowed',
                        }
                      : {}
                  }
                />
              </div>
              <div className="form-field">
                <label htmlFor="unitOfMeasure">Unidade de Medida</label>
                <input
                  id="unitOfMeasure"
                  name="unitOfMeasure"
                  type="text"
                  value={formData.unitOfMeasure}
                  onChange={handleChange}
                  placeholder="un, kg, L, m, cx..."
                />
              </div>
            </div>
            <div className="form-grid two-cols">
              <div className="form-field">
                <label htmlFor="cost">Custo Unitário</label>
                <input
                  id="cost"
                  name="cost"
                  type="number"
                  value={formData.cost || ''}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="R$ 0,00"
                />
              </div>
              <div className="form-field">
                <label htmlFor="location">Localização</label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-grid two-cols">
              <div className="form-field">
                <label htmlFor="minStock">Estoque Mínimo</label>
                <input
                  id="minStock"
                  name="minStock"
                  type="number"
                  value={formData.minStock || 0}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="form-field">
                <label htmlFor="maxStock">Estoque Máximo</label>
                <input
                  id="maxStock"
                  name="maxStock"
                  type="number"
                  value={formData.maxStock || 0}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>
            {error && (
              <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="primary">
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  );
}
