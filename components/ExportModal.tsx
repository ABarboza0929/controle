/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import Modal from './Modal';

type ExportFormat = 'pdf' | 'csv' | 'xlsx';

export interface SortOption {
  value: string;
  label: string;
}

interface ExportModalProps {
  onClose: () => void;
  onExport: (format: ExportFormat, sortBy: string) => void;
  sortOptions: SortOption[];
}

export default function ExportModal({
  onClose,
  onExport,
  sortOptions,
}: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [sortBy, setSortBy] = useState<string>(sortOptions[0]?.value || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExport(format, sortBy);
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2>Exportar Relatório</h2>
          <button type="button" onClick={onClose} className="modalClose">
            <span className="icon">close</span>
          </button>
        </div>
        <div className="modalContent">
          <div className="form-grid">
            <div className="form-field">
              <label>Formato</label>
              <div className="radio-group">
                <div className="radio-option">
                  <input
                    type="radio"
                    id="format-pdf"
                    name="format"
                    value="pdf"
                    checked={format === 'pdf'}
                    onChange={() => setFormat('pdf')}
                  />
                  <label htmlFor="format-pdf">PDF</label>
                </div>
                <div className="radio-option">
                  <input
                    type="radio"
                    id="format-csv"
                    name="format"
                    value="csv"
                    checked={format === 'csv'}
                    onChange={() => setFormat('csv')}
                  />
                  <label htmlFor="format-csv">CSV</label>
                </div>
                <div className="radio-option">
                  <input
                    type="radio"
                    id="format-xlsx"
                    name="format"
                    value="xlsx"
                    checked={format === 'xlsx'}
                    onChange={() => setFormat('xlsx')}
                  />
                  <label htmlFor="format-xlsx">Excel (XLSX)</label>
                </div>
              </div>
            </div>
            {sortOptions && sortOptions.length > 0 && (
              <div className="form-field">
                <label>Ordenar por</label>
                <div className="radio-group">
                  {sortOptions.map(option => (
                    <div className="radio-option" key={option.value}>
                      <input
                        type="radio"
                        id={`sort-${option.value}`}
                        name="sortBy"
                        value={option.value}
                        checked={sortBy === option.value}
                        onChange={() => setSortBy(option.value)}
                      />
                      <label htmlFor={`sort-${option.value}`}>
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="primary">
            <span className="icon">download</span>
            Exportar
          </button>
        </div>
      </form>
    </Modal>
  );
}