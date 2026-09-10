import React from 'react';
import { Link } from 'react-router-dom';
import './ForkliftCard.css';

const ForkliftCard = ({ data }) => {
  const modelo = data['Modelo'] || 'Desconhecido';
  const horimetro = data['Leitura do Horímetro Inicial'] || 'N/A';
  
  const criticos = ['Botão de Emergência', 'Funcionamento de Direção', 'Cinto de Segurança', 'Sistema de Elevação/Abaixamento'];
  let status = 'ok';
  
  const entries = Object.entries(data);
  let isAlert = false;
  let isCritical = false;

  for (const [key, value] of entries) {
    if (value === 'Não Conforme') {
      if (criticos.includes(key) || key.includes('VAZAMENTO') || key.includes('Óleo')) {
        isCritical = true;
      } else {
        isAlert = true;
      }
    }
  }

  if (isCritical) status = 'critical';
  else if (isAlert) status = 'alert';
  else status = 'ok';

  const statusMap = {
    'ok': { label: 'Disponível', class: 'status-ok', icon: '●' },
    'alert': { label: 'Atenção', class: 'status-alert', icon: '▲' },
    'critical': { label: 'Parada', class: 'status-critical', icon: '■' }
  };

  const currentStatus = statusMap[status];

  return (
    <Link to={`/empilhadeira/${encodeURIComponent(modelo)}`} className="forklift-bento-link">
      <div className={`forklift-bento-item ${currentStatus.class}`}>
        {/* Bloco de Identificação Esquerda (estilo data do schedule) */}
        <div className="bento-item-tag">
          <span className="tag-prefix">EER</span>
          <span className="tag-number">{modelo.replace(/[^0-9]/g, '').slice(-2) || '17'}</span>
        </div>

        {/* Informações Principais */}
        <div className="bento-item-details">
          <h4 className="bento-item-name">{modelo}</h4>
          <div className="bento-item-subline">
            <span className="subline-chip" title="Última Inspeção">
              🕒 {data['Data e Hora da Inspeção'] ? data['Data e Hora da Inspeção'].split(' ')[1] || data['Data e Hora da Inspeção'] : '07:30'}
            </span>
            <span className="subline-chip" title="Operador">
              👤 {data['Nome do Operador'] || 'Operador'}
            </span>
            <span className="subline-chip" title="Horímetro">
              ⏱️ {horimetro}h
            </span>
          </div>
        </div>

        {/* Status Badge estilo pílula */}
        <div className="bento-item-badge-wrap">
          <span className={`bento-status-badge ${currentStatus.class}`}>
            <span className="status-dot-mini" />
            {currentStatus.label}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ForkliftCard;
