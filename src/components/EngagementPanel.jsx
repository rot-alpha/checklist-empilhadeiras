import React from 'react';
import './Panels.css';

const EngagementPanel = ({ data, fleetData }) => {
  if (!data || data.length === 0) return <div className="placeholder-panel">Sem dados de engajamento</div>;

  // Agrupamento por Operador
  const operatorCounts = {};
  const shiftCounts = { Manhã: 0, Tarde: 0, Outros: 0 };

  data.forEach(row => {
    const op = (row['Nome do Operador'] || '').trim();
    if (op) {
      operatorCounts[op] = (operatorCounts[op] || 0) + 1;
    }

    const shift = (row['Turno (Manhã / Tarde)'] || '').toLowerCase();
    if (shift.includes('manhã') || shift.includes('manha')) {
      shiftCounts.Manhã += 1;
    } else if (shift.includes('tarde')) {
      shiftCounts.Tarde += 1;
    } else if (shift) {
      shiftCounts.Outros += 1;
    }
  });

  const sortedOperators = Object.entries(operatorCounts).sort((a, b) => b[1] - a[1]);
  const totalInspections = data.length;
  const maxOpCount = sortedOperators.length > 0 ? sortedOperators[0][1] : 1;

  const totalShifts = shiftCounts.Manhã + shiftCounts.Tarde + shiftCounts.Outros;
  const pctManha = totalShifts > 0 ? Math.round((shiftCounts.Manhã / totalShifts) * 100) : 0;
  const pctTarde = totalShifts > 0 ? Math.round((shiftCounts.Tarde / totalShifts) * 100) : 0;

  return (
    <div className="custom-panel bento-engagement-clean-card">
      <div className="bento-card-topbar">
        <div>
          <span className="bento-card-kicker">ADESÃO INDIVIDUAL</span>
          <h3 className="bento-card-title">Engajamento dos Operadores</h3>
        </div>
        <span className="clean-ops-counter">{sortedOperators.length} operadores</span>
      </div>

      <div className="clean-operators-list">
        {sortedOperators.map(([name, count], index) => {
          const pct = Math.round((count / maxOpCount) * 100);
          const initial = name.charAt(0).toUpperCase();
          return (
            <div key={name} className="clean-operator-item">
              <div className="clean-operator-header">
                <div className="clean-operator-avatar-name">
                  <div className={`clean-avatar-circle av-color-${(index % 3) + 1}`}>
                    {initial}
                  </div>
                  <span className="clean-operator-name">{name}</span>
                </div>
                <span className="clean-operator-badge">
                  <strong>{count}</strong> {count === 1 ? 'checklist preenchido' : 'checklists preenchidos'}
                </span>
              </div>

              <div className="clean-operator-bar-track">
                <div 
                  className="clean-operator-bar-fill" 
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}

        {sortedOperators.length === 0 && (
          <p className="no-data">Nenhum operador com registros no período.</p>
        )}
      </div>

      <div className="clean-engagement-footer">
        <span className="clean-footer-text">
          Total de <strong>{totalInspections}</strong> checklists realizados no período
        </span>
      </div>
    </div>
  );
};

export default EngagementPanel;
