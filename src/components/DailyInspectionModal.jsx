import React, { useState, useMemo, useEffect } from 'react';
import { IGNORE_KEYS, calculateConformity } from '../data/csvParser';
import './DailyInspectionModal.css';

const DailyInspectionModal = ({ isOpen, onClose, machineName, dayKey, dayRows = [], usageInfo = null }) => {
  const [activeInspectionIndex, setActiveInspectionIndex] = useState(0);
  const [filterType, setFilterType] = useState('all'); // 'all', 'faults', 'ok'

  // Reset states when day changes or modal opens
  useEffect(() => {
    setActiveInspectionIndex(0);
    setFilterType('all');
  }, [dayKey, isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const formattedDate = useMemo(() => {
    if (!dayKey) return '';
    const [year, month, day] = dayKey.split('-');
    return `${day}/${month}/${year}`;
  }, [dayKey]);

  // Selected inspection
  const currentInspection = dayRows[activeInspectionIndex] || dayRows[0] || null;

  // Extract checklist items for current inspection
  const checklistItems = useMemo(() => {
    if (!currentInspection) return [];
    const items = [];
    Object.entries(currentInspection).forEach(([key, value]) => {
      if (!IGNORE_KEYS.includes(key) && key.trim() !== '') {
        const val = (value || '').trim();
        const isNotConforme = val.toLowerCase() === 'não conforme';
        const isConforme = val.toLowerCase() === 'conforme';
        
        items.push({
          name: key,
          value: val || 'Não respondido',
          status: isNotConforme ? 'fault' : isConforme ? 'ok' : 'other',
        });
      }
    });

    // Sort: faults first, then ok, then others
    return items.sort((a, b) => {
      if (a.status === 'fault' && b.status !== 'fault') return -1;
      if (a.status !== 'fault' && b.status === 'fault') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [currentInspection]);

  // Filtered items based on filterType
  const filteredItems = useMemo(() => {
    if (filterType === 'faults') return checklistItems.filter(i => i.status === 'fault');
    if (filterType === 'ok') return checklistItems.filter(i => i.status === 'ok');
    return checklistItems;
  }, [checklistItems, filterType]);

  const faultCount = checklistItems.filter(i => i.status === 'fault').length;
  const okCount = checklistItems.filter(i => i.status === 'ok').length;
  const conformityRate = currentInspection ? calculateConformity([currentInspection]) : 100;

  if (!isOpen) return null;

  return (
    <div className="daily-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="daily-modal-card" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="daily-modal-header">
          <div className="daily-modal-header-info">
            <div className="daily-modal-badge-group">
              <span className="daily-modal-pill-date">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {formattedDate}
              </span>
              <span className="daily-modal-pill-machine">{machineName}</span>
              {usageInfo && usageInfo.hours !== null && usageInfo.hours > 0 && (
                <span className="daily-modal-pill-hours">
                  +{usageInfo.hours}h operadas no dia
                </span>
              )}
            </div>
            <h2 className="daily-modal-title">Relatório de Inspeção Diária</h2>
          </div>

          <button className="daily-modal-close-btn" onClick={onClose} aria-label="Fechar modal">
            ✕
          </button>
        </div>

        {/* Modal Content */}
        {dayRows.length === 0 ? (
          <div className="daily-modal-empty">
            <div className="daily-empty-icon">📋</div>
            <h3>Nenhum checklist registrado</h3>
            <p>Não há lançamentos de checklist para esta máquina na data {formattedDate}.</p>
          </div>
        ) : (
          <div className="daily-modal-body">
            {/* If more than 1 inspection on the day, show tabs */}
            {dayRows.length > 1 && (
              <div className="daily-inspection-tabs">
                <span className="daily-tabs-label">Inspeções do dia ({dayRows.length}):</span>
                {dayRows.map((row, idx) => {
                  const shift = row['Turno (Manhã / Tarde)'] || `Inspeção ${idx + 1}`;
                  const op = row['Nome do Operador'] || 'Operador';
                  return (
                    <button
                      key={idx}
                      className={`daily-tab-btn ${activeInspectionIndex === idx ? 'active' : ''}`}
                      onClick={() => {
                        setActiveInspectionIndex(idx);
                        setFilterType('all');
                      }}
                    >
                      <span className="daily-tab-shift">{shift}</span>
                      <span className="daily-tab-op">{op}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Operator & Inspection Meta Card */}
            {currentInspection && (
              <div className="daily-meta-card">
                <div className="daily-meta-grid">
                  <div className="daily-meta-item">
                    <span className="daily-meta-lbl">Operador</span>
                    <div className="daily-operator-val">
                      <div className="daily-avatar-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                      <strong className="daily-operator-name">
                        {currentInspection['Nome do Operador'] || 'Não informado'}
                      </strong>
                    </div>
                  </div>

                  <div className="daily-meta-item">
                    <span className="daily-meta-lbl">Turno</span>
                    <strong className="daily-meta-text">
                      {currentInspection['Turno (Manhã / Tarde)'] ? (
                        <span className="daily-shift-badge">
                          {currentInspection['Turno (Manhã / Tarde)']}
                        </span>
                      ) : '—'}
                    </strong>
                  </div>

                  <div className="daily-meta-item">
                    <span className="daily-meta-lbl">Horímetro Inicial</span>
                    <strong className="daily-meta-text">
                      {currentInspection['Leitura do Horímetro Inicial']
                        ? `${currentInspection['Leitura do Horímetro Inicial']} h`
                        : '—'}
                    </strong>
                  </div>

                  <div className="daily-meta-item">
                    <span className="daily-meta-lbl">Horário de Envio</span>
                    <strong className="daily-meta-text">
                      {currentInspection['Carimbo de data/hora'] ||
                       currentInspection['Data e Hora da Inspeção'] ||
                       '—'}
                    </strong>
                  </div>

                  <div className="daily-meta-item highlight">
                    <span className="daily-meta-lbl">Conformidade do Checklist</span>
                    <div className="daily-conformity-pill" style={{
                      '--rate-color': conformityRate >= 90 ? 'var(--status-ok)' : conformityRate >= 70 ? 'var(--status-alert)' : 'var(--status-critical)'
                    }}>
                      <span className="daily-conformity-val">{conformityRate}%</span>
                      <span className="daily-conformity-label">
                        {faultCount === 0 ? 'Aprovado sem falhas' : `${faultCount} item(ns) com falha`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* General observations if present */}
                {currentInspection['Observações sobre o estado geral da empilhadeira. (Opcional)'] && (
                  <div className="daily-observations-box">
                    <span className="daily-obs-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      Observações do Operador:
                    </span>
                    <p className="daily-obs-text">
                      "{currentInspection['Observações sobre o estado geral da empilhadeira. (Opcional)']}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Checklist Section */}
            <div className="daily-checklist-section">
              <div className="daily-checklist-header">
                <div className="daily-checklist-title-wrap">
                  <h3 className="daily-checklist-title">Registros do Checklist</h3>
                  <span className="daily-checklist-subtitle">
                    {checklistItems.length} itens verificados
                  </span>
                </div>

                {/* Filter buttons */}
                <div className="daily-filter-group">
                  <button
                    className={`daily-filter-btn ${filterType === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterType('all')}
                  >
                    Todos ({checklistItems.length})
                  </button>
                  <button
                    className={`daily-filter-btn faults ${filterType === 'faults' ? 'active' : ''}`}
                    onClick={() => setFilterType('faults')}
                  >
                    <span className="filter-dot fault" />
                    Não Conformes ({faultCount})
                  </button>
                  <button
                    className={`daily-filter-btn ok ${filterType === 'ok' ? 'active' : ''}`}
                    onClick={() => setFilterType('ok')}
                  >
                    <span className="filter-dot ok" />
                    Conformes ({okCount})
                  </button>
                </div>
              </div>

              {/* Items List */}
              {filteredItems.length === 0 ? (
                <div className="daily-items-empty">
                  {filterType === 'faults' 
                    ? '🎉 Nenhuma não conformidade registrada nesta inspeção!' 
                    : 'Nenhum item encontrado no filtro selecionado.'}
                </div>
              ) : (
                <div className="daily-items-grid">
                  {filteredItems.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`daily-item-card ${item.status === 'fault' ? 'is-fault' : item.status === 'ok' ? 'is-ok' : ''}`}
                    >
                      <div className="daily-item-info">
                        <span className="daily-item-number">#{idx + 1}</span>
                        <span className="daily-item-name">{item.name}</span>
                      </div>
                      
                      <div className="daily-item-badge">
                        {item.status === 'ok' && (
                          <span className="status-badge-ok">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Conforme
                          </span>
                        )}
                        {item.status === 'fault' && (
                          <span className="status-badge-fault">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="12" y1="8" x2="12" y2="12"/>
                              <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            Não Conforme
                          </span>
                        )}
                        {item.status === 'other' && (
                          <span className="status-badge-other">{item.value}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyInspectionModal;
