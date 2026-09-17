import React from 'react';
import { Link } from 'react-router-dom';
import ConformityRing from './ConformityRing';
import { getMachineStatus } from '../data/csvParser';
import './ForkliftCard.css';

const ForkliftCard = ({ modelo, conformity, latestRow }) => {
  const status = latestRow ? getMachineStatus(latestRow) : { key: 'ok', label: 'Disponível', color: 'var(--status-ok)' };

  return (
    <Link to={`/empilhadeira/${encodeURIComponent(modelo)}`} className="fk-card">
      <div className="fk-card__inner">
        {/* Left: Ring */}
        <div className="fk-card__ring">
          <ConformityRing value={conformity} size={88} strokeWidth={7} />
        </div>

        {/* Center: Info */}
        <div className="fk-card__info">
          <h3 className="fk-card__name">{modelo}</h3>
          <div className="fk-card__meta">
            <span className="fk-card__status" style={{ '--status-color': status.color }}>
              <span className="fk-card__status-dot" />
              {status.label}
            </span>
          </div>
        </div>

        {/* Right: Arrow */}
        <div className="fk-card__arrow">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>
    </Link>
  );
};

export default ForkliftCard;
