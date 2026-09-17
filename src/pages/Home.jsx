import React, { useEffect, useState, useMemo } from 'react';
import ForkliftCard from '../components/ForkliftCard';
import ConformityRing from '../components/ConformityRing';
import EngagementPanel from '../components/EngagementPanel';
import HorimeterPanel from '../components/HorimeterPanel';
import {
  fetchCSVData,
  getAvailableMonths,
  filterByMonth,
  getFleetModels,
  calculateConformity,
  getTopFaults
} from '../data/csvParser';
import './Home.css';

const Home = () => {
  const [fullData, setFullData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    fetchCSVData()
      .then(data => {
        setFullData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar dados:', err);
        setLoading(false);
      });
  }, []);

  const availableMonths = useMemo(() => getAvailableMonths(fullData), [fullData]);

  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0].key);
    }
  }, [availableMonths, selectedMonth]);

  const displayData = useMemo(() => filterByMonth(fullData, selectedMonth), [fullData, selectedMonth]);
  const fleetModels = useMemo(() => getFleetModels(fullData), [fullData]);

  // Stats
  const generalConformity = useMemo(() => calculateConformity(displayData), [displayData]);
  const totalInspections = displayData.length;
  const topFaults = useMemo(() => getTopFaults(displayData, 5), [displayData]);

  // Per machine conformity
  const machineStats = useMemo(() => {
    const machines = {};
    fleetModels.forEach(row => {
      const modelo = row.Modelo;
      const machineData = displayData.filter(r => r.Modelo === modelo);
      machines[modelo] = {
        conformity: calculateConformity(machineData),
        inspections: machineData.length,
        latestRow: row,
      };
    });
    return machines;
  }, [fleetModels, displayData]);

  const totalFaults = topFaults.reduce((acc, [, count]) => acc + count, 0);

  if (loading) {
    return (
      <div className="page-container">
        <div className="home-loading">
          <div className="home-loading__spinner" />
          <span>Carregando dados da frota...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="home-header">
        <div className="home-header__left">
          <h1 className="home-header__title">Dashboard</h1>
          <p className="home-header__subtitle">
            Monitoramento de conformidade da frota
          </p>
        </div>
        <div className="home-header__right">
          <div className="home-month-picker">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="home-month-select"
            >
              {availableMonths.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
              <option value="todos">Todos os Meses</option>
            </select>
          </div>
        </div>
      </header>

      {/* Stats Summary */}
      <section className="home-stats">
        <div className="stat-card stat-card--highlight">
          <div className="stat-card__ring">
            <ConformityRing value={generalConformity} size={72} strokeWidth={6} />
          </div>
          <div className="stat-card__info">
            <span className="stat-card__label">Conformidade Geral</span>
            <span className="stat-card__detail">{totalInspections} inspeções no período</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div className="stat-card__info">
            <span className="stat-card__value">{totalInspections}</span>
            <span className="stat-card__label">Inspeções</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--orange">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="stat-card__info">
            <span className="stat-card__value">{totalFaults}</span>
            <span className="stat-card__label">Não-Conformidades</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="2" ry="2"/>
              <path d="M16 8h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2"/>
            </svg>
          </div>
          <div className="stat-card__info">
            <span className="stat-card__value">{fleetModels.length}</span>
            <span className="stat-card__label">Equipamentos</span>
          </div>
        </div>
      </section>

      {/* Fleet Grid */}
      <section className="home-section">
        <div className="home-section__header">
          <h2 className="home-section__title">Frota</h2>
          <span className="home-section__badge">{fleetModels.length} equipamentos</span>
        </div>

        <div className="home-fleet-grid">
          {fleetModels.map(row => {
            const modelo = row.Modelo;
            const stats = machineStats[modelo] || { conformity: 100, inspections: 0, latestRow: row };
            return (
              <ForkliftCard
                key={modelo}
                modelo={modelo}
                conformity={stats.conformity}
                latestRow={stats.latestRow}
              />
            );
          })}
        </div>
      </section>

      {/* Top Faults */}
      {topFaults.length > 0 && (
        <section className="home-section">
          <div className="home-section__header">
            <h2 className="home-section__title">Top Falhas Detectadas</h2>
            <span className="home-section__badge home-section__badge--alert">
              {topFaults.length} itens
            </span>
          </div>

          <div className="home-faults-card">
            {topFaults.map(([item, count], index) => (
              <div key={item} className="fault-row">
                <div className="fault-row__left">
                  <span className="fault-row__rank">#{index + 1}</span>
                  <span className="fault-row__name">{item}</span>
                </div>
                <div className="fault-row__right">
                  <div className="fault-row__bar-track">
                    <div
                      className="fault-row__bar-fill"
                      style={{ width: `${Math.max(8, (count / topFaults[0][1]) * 100)}%` }}
                    />
                  </div>
                  <span className="fault-row__count">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Hourmeter Utilization */}
      <HorimeterPanel fullData={fullData} />

      {/* Operator Engagement */}
      <EngagementPanel fullData={fullData} />
    </div>
  );
};

export default Home;
