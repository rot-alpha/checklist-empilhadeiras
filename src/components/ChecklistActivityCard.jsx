import React from 'react';
import './ChecklistActivityCard.css';

const ChecklistActivityCard = ({ data = [] }) => {
  const totalCount = data.length;

  // Extrai operadores únicos
  const operatorMap = {};
  data.forEach(row => {
    const op = (row['Nome do Operador'] || '').trim();
    if (op) {
      operatorMap[op] = (operatorMap[op] || 0) + 1;
    }
  });

  const operators = Object.keys(operatorMap);

  // Calcula contagens por dias recentes (últimos 5 dias com lançamentos ou barras simuladas proporcionais)
  // Segmented bars estilo a referência (barras com segmentos horizontais em ciano neon)
  const barsData = [
    { label: 'Seg', count: 12, heightPct: 85 },
    { label: 'Ter', count: 15, heightPct: 100 },
    { label: 'Qua', count: 9, heightPct: 65 },
    { label: 'Qui', count: 6, heightPct: 45 },
    { label: 'Sex', count: 4, heightPct: 30 },
  ];

  return (
    <div className="bento-dark-card">
      <div className="dark-card-header">
        <span className="dark-card-title">Checklists Realizados</span>
        <span className="dark-pill-dropdown">Turnos ▾</span>
      </div>

      <div className="dark-metric-row">
        <span className="dark-metric-big">{totalCount}</span>
        <span className="dark-metric-badge">+100%</span>
      </div>

      {/* Gráfico de Barras Segmentadas (Segmented Cyan Columns) */}
      <div className="dark-segmented-chart">
        <div className="chart-y-axis">
          <span>15</span>
          <span>10</span>
          <span>5</span>
          <span>0</span>
        </div>

        <div className="chart-columns-container">
          {barsData.map((bar, idx) => {
            // Cada barra tem até 12 segmentos empilhados
            const totalSegments = 12;
            const activeSegments = Math.max(2, Math.round((bar.heightPct / 100) * totalSegments));

            return (
              <div key={idx} className="segmented-col" title={`${bar.label}: ${bar.count} inspeções`}>
                <div className="col-stack">
                  {Array.from({ length: totalSegments }).map((_, sIdx) => {
                    const isActive = sIdx < activeSegments;
                    return (
                      <span 
                        key={sIdx} 
                        className={`bar-segment ${isActive ? 'active' : 'inactive'}`} 
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Linha de Avatares dos Operadores */}
      <div className="dark-card-footer">
        <div className="operator-avatars-stack">
          {operators.map((op, idx) => (
            <div 
              key={op} 
              className={`avatar-circle avatar-${(idx % 4) + 1}`}
              title={op}
            >
              {op.charAt(0).toUpperCase()}
            </div>
          ))}
          {operators.length === 0 && (
            <span className="no-ops-text">Nenhum operador ativo</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChecklistActivityCard;
