import React from 'react';
import './Panels.css';

const TopFaultsPanel = ({ data }) => {
  if (!data || data.length === 0) return <div className="placeholder-panel">Sem dados</div>;

  // Filtra apenas colunas de inspeção
  const ignoreKeys = ['Carimbo de data/hora', 'Data e Hora da Inspeção', 'Nome do Operador', 'Turno (Manhã / Tarde)', 'Modelo', 'Leitura do Horímetro Inicial', 'Observações sobre o estado geral da empilhadeira. (Opcional)'];
  
  const faults = {};

  data.forEach(row => {
    Object.entries(row).forEach(([key, value]) => {
      if (!ignoreKeys.includes(key) && value === 'Não Conforme') {
        faults[key] = (faults[key] || 0) + 1;
      }
    });
  });

  const sortedFaults = Object.entries(faults)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Top 5

  return (
    <div className="custom-panel bento-faults-card">
      <div className="faults-card-topbar">
        <div>
          <span className="faults-kicker">SEGURANÇA & MANUTENÇÃO</span>
          <h3 className="faults-card-title">Top Falhas Detectadas</h3>
        </div>
        <span className="faults-count-badge">
          {sortedFaults.length} {sortedFaults.length === 1 ? 'não-conformidade' : 'não-conformidades'}
        </span>
      </div>

      <p className="faults-card-desc">
        Itens com maior frequência de apontamento nos checklists do período:
      </p>

      {sortedFaults.length === 0 ? (
        <div className="amber-empty-state">
          <span>✓ Nenhuma não-conformidade registrada no período selecionado.</span>
        </div>
      ) : (
        <div className="faults-clean-list">
          {sortedFaults.map(([item, count]) => (
            <div key={item} className="faults-clean-item">
              <div className="fault-item-left">
                <span className="fault-item-icon">⚠️</span>
                <span className="fault-item-name" title={item}>{item}</span>
              </div>
              <span className="fault-item-count-badge">
                {count} {count === 1 ? 'ocorrência' : 'ocorrências'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="clean-engagement-footer">
        <span className="clean-footer-text">
          Auditoria preventiva baseada nas inspeções dos operadores
        </span>
      </div>
    </div>
  );
};

export default TopFaultsPanel;
