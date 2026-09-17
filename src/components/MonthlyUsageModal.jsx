import React from 'react';
import './MonthlyUsageModal.css';

const MonthlyUsageModal = ({ isOpen, onClose, machineName, monthLabel, monthlyData }) => {
  if (!isOpen || !monthlyData) return null;

  const { totalHours, activeDays, avgDailyHours, maxDayHours, dailyList } = monthlyData;

  // Compute chart scale
  const chartMax = Math.max(maxDayHours * 1.15, 1);

  return (
    <div className="monthly-modal-overlay" onClick={onClose}>
      <div className="monthly-modal-card" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="monthly-modal-header">
          <div className="monthly-modal-title-group">
            <span className="monthly-modal-subtitle">Compilado Mensal de Utilização</span>
            <h2 className="monthly-modal-title">
              {machineName} — <span className="monthly-modal-month">{monthLabel}</span>
            </h2>
          </div>
          <button className="monthly-modal-close-btn" onClick={onClose} aria-label="Fechar modal">
            ✕
          </button>
        </div>

        {/* Big Numeric Summary */}
        <div className="monthly-modal-stats-grid">
          <div className="monthly-stat-box primary">
            <span className="monthly-stat-box__label">Total do Horímetro Mensal</span>
            <div className="monthly-stat-box__val-wrap">
              <span className="monthly-stat-box__val">{totalHours.toLocaleString('pt-BR')}</span>
              <span className="monthly-stat-box__unit">horas</span>
            </div>
            <span className="monthly-stat-box__desc">Soma das horas trabalhadas no mês</span>
          </div>

          <div className="monthly-stat-box">
            <span className="monthly-stat-box__label">Média por Dia Operado</span>
            <div className="monthly-stat-box__val-wrap">
              <span className="monthly-stat-box__val">{avgDailyHours.toLocaleString('pt-BR')}</span>
              <span className="monthly-stat-box__unit">h/dia</span>
            </div>
            <span className="monthly-stat-box__desc">Considerando {activeDays} dias ativos</span>
          </div>

          <div className="monthly-stat-box">
            <span className="monthly-stat-box__label">Pico de Utilização</span>
            <div className="monthly-stat-box__val-wrap">
              <span className="monthly-stat-box__val">{maxDayHours.toLocaleString('pt-BR')}</span>
              <span className="monthly-stat-box__unit">horas</span>
            </div>
            <span className="monthly-stat-box__desc">Maior consumo em um único dia</span>
          </div>
        </div>

        {/* Daily Utilization Comparative Chart */}
        <div className="monthly-modal-chart-section">
          <div className="monthly-chart-header">
            <h3 className="monthly-chart-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-2px', marginRight: '6px' }}>
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              Comparativo de Utilização Diária
            </h3>
            <span className="monthly-chart-legend">
              <span className="legend-dot" /> Horas trabalhadas (Δ D+1 - D)
            </span>
          </div>

          {dailyList.length === 0 ? (
            <div className="monthly-chart-empty">Nenhum registro de utilização para este mês.</div>
          ) : (
            <div className="monthly-chart-container">
              <div className="monthly-bars-track">
                {dailyList.map((entry) => {
                  const dayNum = entry.dayKey.split('-')[2];
                  const hasHours = entry.hours !== null && entry.hours > 0;
                  const heightPct = hasHours ? (entry.hours / chartMax) * 100 : 4;
                  const isMax = hasHours && entry.hours === maxDayHours;

                  return (
                    <div key={entry.dayKey} className={`monthly-bar-col ${isMax ? 'is-max' : ''}`}>
                      {/* Bar and Tooltip */}
                      <div className="monthly-bar-wrapper">
                        <div 
                          className={`monthly-bar ${entry.pending ? 'is-pending' : ''} ${isMax ? 'is-peak' : ''}`}
                          style={{ height: `${Math.max(6, Math.min(100, heightPct))}%` }}
                        >
                          <div className="monthly-bar-tooltip">
                            <span className="tooltip-date">Dia {entry.dateFormatted}</span>
                            <span className="tooltip-val">
                              {entry.pending ? 'Aguardando próxima leitura' : `${entry.hours} horas`}
                            </span>
                            {entry.startReading && (
                              <span className="tooltip-readings">
                                Horímetro: {entry.startReading}h
                                {entry.nextReading ? ` ➔ ${entry.nextReading}h` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Value label above or below */}
                      <span className="monthly-bar-val-label">
                        {entry.pending ? '—' : (entry.hours !== null ? `${entry.hours}h` : '0')}
                      </span>

                      {/* Day Number */}
                      <span className="monthly-bar-day-label">{dayNum}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info notice */}
        <div className="monthly-modal-footer">
          <p className="monthly-modal-note">
            💡 <strong>Regra de Cálculo:</strong> As horas do dia são computadas pela diferença entre o horímetro do dia seguinte e o horímetro do dia atual. O último dia registrado permanece pendente até a leitura do dia seguinte.
          </p>
          <button className="monthly-modal-confirm-btn" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthlyUsageModal;
