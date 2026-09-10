import React from 'react';
import SpeedometerGauge from './SpeedometerGauge';
import './Panels.css';

const UtilizationMetricsPanel = ({ data, fleetData }) => {
  if (!data || data.length === 0 || !fleetData || fleetData.length === 0) {
    return <div className="placeholder-panel">Sem dados de utilização</div>;
  }

  // Contar dias únicos de inspeção no dataset inteiro
  const uniqueDays = new Set();
  data.forEach(row => {
    const dateStr = row['Data e Hora da Inspeção'] || row['Carimbo de data/hora'];
    if (dateStr) {
      const dayPart = dateStr.split(' ')[0];
      if (dayPart) uniqueDays.add(dayPart);
    }
  });

  const totalDays = Math.max(uniqueDays.size, 1);
  const expectedPerEquipment = totalDays * 2; // 2 turnos por dia (1º Turno Manhã / 2º Turno Tarde)

  // Contar inspeções por modelo
  const inspectionsByModel = {};
  data.forEach(row => {
    const modelo = row['Modelo'];
    if (modelo) {
      inspectionsByModel[modelo] = (inspectionsByModel[modelo] || 0) + 1;
    }
  });

  // Calcular métricas para cada equipamento
  let totalInspectionsFleet = 0;
  const metrics = fleetData.map(equip => {
    const modelo = equip['Modelo'] || 'Desconhecido';
    const inspections = inspectionsByModel[modelo] || 0;
    totalInspectionsFleet += inspections;
    const percentage = Math.min(Math.round((inspections / expectedPerEquipment) * 100), 100);
    return { modelo, inspections, percentage };
  });

  // Média global da frota
  const totalExpectedFleet = expectedPerEquipment * fleetData.length;
  const fleetAveragePct = totalExpectedFleet > 0
    ? Math.min(Math.round((totalInspectionsFleet / totalExpectedFleet) * 100), 100)
    : 0;

  // Ordenar por percentual (desc)
  metrics.sort((a, b) => b.percentage - a.percentage);

  const getPerformanceTag = (pct) => {
    if (pct >= 80) return { label: 'Alta Utilização', class: 'tag-ok' };
    if (pct >= 50) return { label: 'Utilização Média', class: 'tag-alert' };
    return { label: 'Baixa Utilização', class: 'tag-critical' };
  };

  // Contagem por turno
  let countManha = 0;
  let countTarde = 0;
  data.forEach(row => {
    const shift = (row['Turno (Manhã / Tarde)'] || '').toLowerCase();
    if (shift.includes('manhã') || shift.includes('manha')) countManha++;
    else if (shift.includes('tarde')) countTarde++;
  });

  const totalShiftsRecorded = countManha + countTarde;
  const pctManhaWidth = totalShiftsRecorded > 0 ? Math.max(15, Math.round((countManha / totalShiftsRecorded) * 100)) : 50;
  const pctTardeWidth = 100 - pctManhaWidth;

  return (
    <div className="custom-panel bento-utilization-card">
      <div className="panel-header-compact">
        <div>
          <span className="bento-card-kicker">Horas & Turnos Diários</span>
          <h3 className="bento-hero-metric">
            ⏳ 2 Turnos Ativos
          </h3>
        </div>
        <div className="bento-nav-arrows">
          <button type="button" className="bento-arrow-btn">‹</button>
          <button type="button" className="bento-arrow-btn">›</button>
        </div>
      </div>

      {/* Velocímetro Mestre da Frota */}
      <div className="fleet-gauge-hero">
        <SpeedometerGauge
          value={fleetAveragePct}
          size={135}
          showNeedle={true}
        />
        <div className="fleet-gauge-info">
          <span className="hero-kicker">Aderência Global</span>
          <h4 className="hero-title">{fleetAveragePct}% Utilização</h4>
          <span className="hero-stat-detail">
            <strong>{totalInspectionsFleet}</strong> de <strong>{totalExpectedFleet}</strong> inspeções
          </span>
          <span className={`hero-status-pill ${getPerformanceTag(fleetAveragePct).class}`}>
            {getPerformanceTag(fleetAveragePct).label}
          </span>
        </div>
      </div>

      {/* Divisão dos Turnos com Barras Listradas Diagonais (estilo referência) */}
      <div className="bento-shifts-split">
        <div className="shifts-metric-labels">
          <div className="shift-label-block">
            <span className="shift-block-title">1º Turno (Manhã)</span>
            <span className="shift-block-value">{countManha} {countManha === 1 ? 'checklist' : 'checklists'}</span>
          </div>
          <div className="shift-label-block">
            <span className="shift-block-title">2º Turno (Tarde)</span>
            <span className="shift-block-value">{countTarde} {countTarde === 1 ? 'checklist' : 'checklists'}</span>
          </div>
        </div>

        <div className="bento-striped-bar-track">
          <div 
            className="bento-striped-segment manha-striped" 
            style={{ width: `${pctManhaWidth}%` }}
            title={`1º Turno (Manhã): ${countManha}`}
          />
          <div 
            className="bento-striped-segment tarde-striped" 
            style={{ width: `${pctTardeWidth}%` }}
            title={`2º Turno (Tarde): ${countTarde}`}
          />
        </div>
      </div>

      {/* Grid de Velocímetros Individuais */}
      <div className="equipment-gauges-section">
        <span className="section-label-sub">Por Equipamento</span>
        <div className="equipment-gauges-grid">
          {metrics.map(({ modelo, inspections, percentage }) => {
            return (
              <div key={modelo} className="equipment-gauge-card">
                <div className="gauge-card-header">
                  <span className="equip-gauge-name" title={modelo}>{modelo}</span>
                </div>

                <div className="gauge-wrapper">
                  <SpeedometerGauge
                    value={percentage}
                    size={115}
                    showNeedle={true}
                  />
                </div>

                <div className="gauge-card-footer">
                  <span className="gauge-inspection-count">
                    {inspections} de {expectedPerEquipment} {expectedPerEquipment === 1 ? 'turno' : 'turnos'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UtilizationMetricsPanel;
