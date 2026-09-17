import React, { useMemo } from 'react';
import { getHorimeterUtilization } from '../data/csvParser';
import './HorimeterPanel.css';

const HorimeterPanel = ({ fullData }) => {
  const utilization = useMemo(() => getHorimeterUtilization(fullData), [fullData]);
  
  const totalHours = useMemo(() => {
    return utilization.reduce((acc, m) => acc + m.maxHours, 0);
  }, [utilization]);

  const avgHours = useMemo(() => {
    if (utilization.length === 0) return 0;
    return Math.round(totalHours / utilization.length);
  }, [totalHours, utilization]);

  if (utilization.length === 0) return null;

  return (
    <section className="home-section">
      <div className="home-section__header">
        <h2 className="home-section__title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-3px', marginRight: '6px' }}>
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Índice de Utilização da Frota (Horímetro)
        </h2>
        <span className="home-section__badge">
          {totalHours.toLocaleString('pt-BR')}h acumuladas
        </span>
      </div>

      {/* Cards de Resumo Numérico Principal */}
      <div className="horimeter-summary-grid">
        <div className="horimeter-summary-card">
          <span className="horimeter-summary-card__label">Total Acumulado Frota</span>
          <div className="horimeter-summary-card__value-wrap">
            <span className="horimeter-summary-card__value">{totalHours.toLocaleString('pt-BR')}</span>
            <span className="horimeter-summary-card__unit">horas</span>
          </div>
          <span className="horimeter-summary-card__hint">Soma dos horímetros mais recentes</span>
        </div>

        <div className="horimeter-summary-card">
          <span className="horimeter-summary-card__label">Média por Máquina</span>
          <div className="horimeter-summary-card__value-wrap">
            <span className="horimeter-summary-card__value">{avgHours.toLocaleString('pt-BR')}</span>
            <span className="horimeter-summary-card__unit">horas/máquina</span>
          </div>
          <span className="horimeter-summary-card__hint">Baseado em {utilization.length} equipamentos</span>
        </div>

        <div className="horimeter-summary-card">
          <span className="horimeter-summary-card__label">Maior Utilização</span>
          <div className="horimeter-summary-card__value-wrap">
            <span className="horimeter-summary-card__value">{utilization[0]?.maxHours.toLocaleString('pt-BR')}</span>
            <span className="horimeter-summary-card__unit">horas</span>
          </div>
          <span className="horimeter-summary-card__hint highlight-model">{utilization[0]?.modelo}</span>
        </div>
      </div>

      {/* Grid de Cartões Numéricos Individuais por Máquina */}
      <div className="horimeter-numbers-grid">
        {utilization.map(({ modelo, maxHours, percentage }) => (
          <div key={modelo} className="horimeter-number-card">
            <div className="horimeter-number-card__top">
              <span className="horimeter-number-card__name">{modelo}</span>
              <span className="horimeter-number-card__pct">{percentage}% da frota</span>
            </div>
            
            <div className="horimeter-number-card__main">
              <span className="horimeter-number-card__val">{maxHours.toLocaleString('pt-BR')}</span>
              <span className="horimeter-number-card__lbl">horas registradas</span>
            </div>

            <div className="horimeter-number-card__bar-bg">
              <div 
                className="horimeter-number-card__bar-fill" 
                style={{ width: `${Math.min(100, Math.max(8, percentage))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HorimeterPanel;
