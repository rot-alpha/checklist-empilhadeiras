import React, { useState, useMemo } from 'react';
import { getEngagementByMonth, getOperatorCalendarDetail } from '../data/csvParser';
import './EngagementPanel.css';

const EngagementPanel = ({ fullData }) => {
  const [selectedOperator, setSelectedOperator] = useState(null);
  const engagementData = useMemo(() => getEngagementByMonth(fullData), [fullData]);

  const calendarDetail = useMemo(() => {
    if (!selectedOperator) return [];
    return getOperatorCalendarDetail(fullData, selectedOperator);
  }, [fullData, selectedOperator]);

  const getConformityColor = (pct) => {
    if (pct >= 80) return 'var(--status-ok)';
    if (pct >= 50) return 'var(--status-alert)';
    return 'var(--status-critical)';
  };

  if (!engagementData || engagementData.length === 0) return null;

  return (
    <>
      <section className="home-section">
        <div className="home-section__header">
          <h2 className="home-section__title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-3px', marginRight: '6px' }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Engajamento dos Operadores
          </h2>
          <span className="engagement-subtitle">Dias de formulários preenchidos por mês</span>
        </div>

        <div className="engagement-grid">
          {engagementData.map(({ monthKey, label, operators }) => (
            <div key={monthKey} className="engagement-month-col">
              <div className="engagement-month-header">
                <span className="engagement-month-label">{label}</span>
              </div>
              <div className="engagement-operators-list">
                {operators.map(({ name, days }) => (
                  <button
                    key={name}
                    className="engagement-op-row"
                    onClick={() => setSelectedOperator(name)}
                    title={`Clique para ver calendário de ${name}`}
                  >
                    <span className="engagement-op-name">{name}</span>
                    <span className="engagement-op-days">
                      {days} {days === 1 ? 'dia' : 'dias'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Operator Calendar Modal */}
      {selectedOperator && (
        <div className="op-calendar-overlay" onClick={() => setSelectedOperator(null)}>
          <div className="op-calendar-modal" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="op-calendar-header">
              <div>
                <h3 className="op-calendar-title">{selectedOperator}</h3>
                <p className="op-calendar-subtitle">
                  {calendarDetail.length} {calendarDetail.length === 1 ? 'dia registrado' : 'dias registrados'}
                </p>
              </div>
              <button className="op-calendar-close" onClick={() => setSelectedOperator(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="op-calendar-body">
              {calendarDetail.length === 0 ? (
                <p className="op-calendar-empty">Nenhum registro encontrado.</p>
              ) : (
                <div className="op-calendar-list">
                  {calendarDetail.map(({ dayKey, date, conformity, inspections }) => (
                    <div key={dayKey} className="op-calendar-day">
                      <div className="op-calendar-day__left">
                        <span className="op-calendar-day__date">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          {date}
                        </span>
                        <span className="op-calendar-day__inspections">
                          {inspections} {inspections === 1 ? 'inspeção' : 'inspeções'}
                        </span>
                      </div>
                      <div className="op-calendar-day__right">
                        <span
                          className="op-calendar-day__pct"
                          style={{ color: getConformityColor(conformity) }}
                        >
                          {conformity}%
                        </span>
                        <div className="op-calendar-day__bar-track">
                          <div
                            className="op-calendar-day__bar-fill"
                            style={{
                              width: `${conformity}%`,
                              background: getConformityColor(conformity),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EngagementPanel;
