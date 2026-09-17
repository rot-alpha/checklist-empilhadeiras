import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ConformityRing from '../components/ConformityRing';
import MachineCalendar from '../components/MachineCalendar';
import {
  fetchCSVData,
  calculateConformity,
  getTopFaults,
  getMachineStatus,
  getAvailableMonths,
  filterByMonth,
  getMachineDailyUtilization,
  getMachineMonthlyUtilization
} from '../data/csvParser';
import './ForkliftDetail.css';

const ForkliftDetail = () => {
  const { modelo } = useParams();
  const decodedModelo = decodeURIComponent(modelo);

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
        console.error('Erro:', err);
        setLoading(false);
      });
  }, []);

  const machineFullData = useMemo(() =>
    fullData.filter(row => row.Modelo === decodedModelo),
    [fullData, decodedModelo]
  );

  const availableMonths = useMemo(() => getAvailableMonths(machineFullData), [machineFullData]);

  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0].key);
    }
  }, [availableMonths, selectedMonth]);

  const displayData = useMemo(() => filterByMonth(machineFullData, selectedMonth), [machineFullData, selectedMonth]);
  const history = useMemo(() => [...displayData].reverse(), [displayData]);

  const conformity = useMemo(() => calculateConformity(displayData), [displayData]);
  const topFaults = useMemo(() => getTopFaults(displayData, 5), [displayData]);
  const latestRow = history[0] || {};
  const status = latestRow.Modelo ? getMachineStatus(latestRow) : { key: 'ok', label: 'Disponível', color: 'var(--status-ok)' };

  // Calculate monthly utilization hours for the current selected month
  const monthlyUtil = useMemo(() => {
    if (!selectedMonth || selectedMonth === 'todos') return null;
    const dailyMap = getMachineDailyUtilization(machineFullData);
    return getMachineMonthlyUtilization(dailyMap, selectedMonth);
  }, [machineFullData, selectedMonth]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="detail-loading">
          <div className="detail-loading__spinner" />
          <span>Carregando dados...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <header className="detail-header">
        <div className="detail-header__left">
          <h1 className="detail-header__title">{decodedModelo}</h1>
          <span className="detail-header__status" style={{ '--status-color': status.color }}>
            <span className="detail-header__status-dot" />
            {status.label}
          </span>
        </div>
        <div className="detail-header__right">
          <div className="detail-month-picker">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="detail-month-select"
            >
              {availableMonths.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
              <option value="todos">Todos os Meses</option>
            </select>
          </div>
        </div>
      </header>

      {/* Stats Row with numeric cards */}
      <section className="detail-stats">
        <div className="detail-stat-card detail-stat-card--ring">
          <ConformityRing value={conformity} size={96} strokeWidth={8} label="Conf." />
        </div>

        <div className="detail-stat-card">
          <span className="detail-stat__value">{displayData.length}</span>
          <span className="detail-stat__label">Inspeções</span>
        </div>

        <div className="detail-stat-card">
          <span className="detail-stat__value">{topFaults.length}</span>
          <span className="detail-stat__label">Tipos de Falhas</span>
        </div>

        <div className="detail-stat-card">
          <span className="detail-stat__value">
            {monthlyUtil ? `${monthlyUtil.totalHours}h` : (latestRow['Leitura do Horímetro Inicial'] || '—')}
          </span>
          <span className="detail-stat__label">
            {monthlyUtil ? 'Horas no Mês' : 'Horímetro Atual (h)'}
          </span>
        </div>
      </section>

      {/* Machine Utilization Calendar */}
      <MachineCalendar
        machineName={decodedModelo}
        machineRows={machineFullData}
      />

      {/* Content Grid */}
      <div className="detail-content">
        {/* Faults */}
        {topFaults.length > 0 && (
          <section className="detail-card">
            <div className="detail-card__header">
              <h2 className="detail-card__title">Não-Conformidades</h2>
              <span className="detail-card__badge">{topFaults.length} itens</span>
            </div>
            <div className="detail-faults">
              {topFaults.map(([item, count], index) => (
                <div key={item} className="detail-fault-item">
                  <span className="detail-fault-rank">#{index + 1}</span>
                  <span className="detail-fault-name">{item}</span>
                  <span className="detail-fault-count">{count}x</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* History Table */}
        <section className="detail-card detail-card--wide">
          <div className="detail-card__header">
            <h2 className="detail-card__title">Histórico de Inspeções</h2>
            <span className="detail-card__badge">{history.length} registros</span>
          </div>

          {history.length === 0 ? (
            <p className="detail-empty">Nenhuma inspeção encontrada no período.</p>
          ) : (
            <div className="detail-table-wrap">
              <table className="detail-table">
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Operador</th>
                    <th>Turno</th>
                    <th>Horímetro</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row, index) => {
                    const hasProblem = Object.values(row).includes('Não Conforme');
                    const horimetro = row['Leitura do Horímetro Inicial'];
                    const turno = row['Turno (Manhã / Tarde)'];
                    return (
                      <tr key={index}>
                        <td className="detail-table-date">
                          {row['Carimbo de data/hora'] || row['Data e Hora da Inspeção']}
                        </td>
                        <td className="detail-table-operator">
                          <strong>{row['Nome do Operador'] || '—'}</strong>
                        </td>
                        <td>
                          {turno ? (
                            <span className="detail-shift-tag">{turno}</span>
                          ) : '—'}
                        </td>
                        <td className="detail-table-hourmeter">
                          {horimetro ? `${horimetro} h` : '—'}
                        </td>
                        <td>
                          <span className={`detail-badge ${hasProblem ? 'detail-badge--alert' : 'detail-badge--ok'}`}>
                            <span className="detail-badge-dot" />
                            {hasProblem ? 'Com Falhas' : 'Conforme'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ForkliftDetail;
