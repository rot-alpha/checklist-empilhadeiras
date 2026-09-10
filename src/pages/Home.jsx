import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import ForkliftCard from '../components/ForkliftCard';
import TopFaultsPanel from '../components/UtilizationPanel';
import EngagementPanel from '../components/EngagementPanel';
import UtilizationMetricsPanel from '../components/UtilizationMetricsPanel';
import CalendarModal from '../components/CalendarModal';
import './Home.css';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRuiTWVDNhAVtbah-F5-1ReFHH57pkhlM1mtrQOOh6nUNXB2wof8AMjaP_Mnjk6K5hU4rzs6OvhAZit/pub?output=csv';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function extractMonthKey(dateStr) {
  if (!dateStr) return null;
  const match = String(dateStr).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const month = match[2].padStart(2, '0');
  const year = match[3];
  return `${year}-${month}`;
}

const Home = () => {
  const [fleetData, setFleetData] = useState([]);
  const [fullData, setFullData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      complete: (results) => {
        const data = results.data.filter(row => row.Modelo); // filter empty rows
        setFullData(data);
        
        // Group by Modelo to get the latest inspection
        const latestInspections = {};
        data.forEach(row => {
          latestInspections[row.Modelo] = row; 
        });

        setFleetData(Object.values(latestInspections));
        setLoading(false);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        setLoading(false);
      }
    });
  }, []);

  // Meses disponíveis com dados
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    fullData.forEach(row => {
      const raw = row['Data e Hora da Inspeção'] || row['Carimbo de data/hora'];
      const key = extractMonthKey(raw);
      if (key) monthsSet.add(key);
    });

    const list = Array.from(monthsSet).sort().reverse();
    return list.map(key => {
      const [y, m] = key.split('-');
      const monthName = MONTH_NAMES[parseInt(m, 10) - 1];
      return { key, label: `${monthName} ${y}` };
    });
  }, [fullData]);

  // Define o mês inicial assim que carregar
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0].key);
    }
  }, [availableMonths, selectedMonth]);

  // Dataset filtrado pelo mês selecionado
  const displayData = useMemo(() => {
    if (!selectedMonth || selectedMonth === 'todos') return fullData;
    return fullData.filter(row => {
      const raw = row['Data e Hora da Inspeção'] || row['Carimbo de data/hora'];
      return extractMonthKey(raw) === selectedMonth;
    });
  }, [fullData, selectedMonth]);

  // Cálculo de horímetro acumulado para o card de análise
  const totalHorimeter = fleetData.reduce((acc, curr) => {
    const val = parseFloat(String(curr['Leitura do Horímetro Inicial'] || '0').replace(',', '.'));
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <div className="home-container">
      {/* Header Bento com Seletor de Mês e Ação para Abertura do Calendário */}
      <header className="bento-header">
        <div className="bento-header-info">
          <div className="header-badge-row">
            <span className="operational-live-dot" />
            <span className="operational-live-tag">Operação em Tempo Real</span>
            <span className="shift-badge-pill">2 Turnos Ativos</span>
          </div>
          <h1 className="bento-header-title">Dashboard Logístico — Frota</h1>
          <p className="bento-header-desc">
            Monitoramento inteligente de disponibilidade, conformidade e checklists operacionais
          </p>
        </div>

        <div className="bento-header-actions">
          {/* Seletor Global de Mês */}
          <div className="bento-month-picker">
            <span className="month-picker-icon">📅</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bento-month-select"
              title="Selecione o mês para filtrar o dashboard"
            >
              {availableMonths.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
              <option value="todos">Todos os Meses (Geral)</option>
            </select>
          </div>

          <button 
            type="button" 
            className="bento-calendar-trigger-btn"
            onClick={() => setIsCalendarOpen(true)}
            title="Abrir Calendário de Inspeções & Lançamentos"
          >
            <span className="btn-cal-icon">🗓️</span>
            <span>Calendário</span>
            <span className="btn-cal-badge">{displayData.length}</span>
          </button>
        </div>
      </header>

      {/* Grid Principal Bento (3 Colunas Harmônicas) */}
      <main className="bento-dashboard-grid">
        {/* ─── COLUNA 1: Status da Frota + Análise de Horímetro ─── */}
        <section className="bento-col bento-col-1">
          {/* Card: Status da Frota */}
          <div className="custom-panel bento-fleet-card">
            <div className="bento-card-topbar">
              <div>
                <span className="bento-card-kicker">FROTA ATIVA</span>
                <h3 className="bento-card-title">Status dos Equipamentos</h3>
              </div>
              <span className="bento-more-dots">•••</span>
            </div>

            {loading ? (
              <p className="loading-text">Carregando dados da frota...</p>
            ) : (
              <div className="bento-fleet-list">
                {fleetData.map((data, index) => (
                  <ForkliftCard key={index} data={data} />
                ))}
              </div>
            )}
          </div>

          {/* Card: Análise de Horímetro */}
          <div className="custom-panel bento-hours-card">
            <div className="bento-card-topbar">
              <div>
                <span className="bento-card-kicker">HORÍMETRO OPERACIONAL</span>
                <h3 className="bento-card-title">Tempo Acumulado</h3>
              </div>
              <span className="dark-pill-dropdown">Turnos ▾</span>
            </div>

            <div className="hours-metric-row">
              <span className="hours-big-number">
                {Math.round(totalHorimeter).toLocaleString('pt-BR')}h
              </span>
              <span className="hours-sub-label">frota total</span>
            </div>

            <div className="hours-chart-simulation">
              <div className="hours-pill-legend">
                <span className="legend-chip chip-manha">● 1º Turno (Manhã)</span>
                <span className="legend-chip chip-tarde">● 2º Turno (Tarde)</span>
              </div>
              <svg viewBox="0 0 240 60" className="hours-wave-svg">
                <path 
                  d="M 10 40 Q 60 15 120 25 T 230 20" 
                  fill="none" 
                  stroke="#8b5cf6" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                />
                <path 
                  d="M 10 50 Q 70 35 130 45 T 230 38" 
                  fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                />
              </svg>
              <div className="hours-week-days">
                <span>Seg</span>
                <span>Ter</span>
                <span className="active-day">Qua</span>
                <span>Qui</span>
                <span>Sex</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── COLUNA 2: Métricas de Utilização (Velocímetro & Turnos) ─── */}
        <section className="bento-col bento-col-2">
          {loading ? (
            <div className="custom-panel loading-placeholder">Carregando métricas...</div>
          ) : (
            <UtilizationMetricsPanel data={displayData} fleetData={fleetData} />
          )}
        </section>

        {/* ─── COLUNA 3: Top Falhas Detectadas + Engajamento dos Operadores ─── */}
        <section className="bento-col bento-col-3">
          {/* Card: Top Falhas Detectadas (Substituiu o Checklists Realizados) */}
          {loading ? (
            <div className="custom-panel loading-placeholder">Carregando falhas...</div>
          ) : (
            <TopFaultsPanel data={displayData} />
          )}

          {/* Card: Engajamento dos Operadores (Clean) */}
          {loading ? (
            <div className="custom-panel loading-placeholder">Carregando engajamento...</div>
          ) : (
            <EngagementPanel data={displayData} fleetData={fleetData} />
          )}
        </section>
      </main>

      {/* ─── FAIXA INFERIOR (FULL WIDTH): Meta Mensal de Inspeções ─── */}
      <footer className="bento-bottom-section">
        <div className="bento-monthly-goal-card">
          <div className="monthly-goal-header">
            <h4 className="monthly-goal-title">Progresso Mensal em Direção à Meta da Frota</h4>
            <div className="monthly-goal-right">
              <div className="bento-nav-arrows">
                <button type="button" className="bento-arrow-btn">‹</button>
                <button type="button" className="bento-arrow-btn">›</button>
              </div>
              <span className="monthly-pct-badge">82%</span>
            </div>
          </div>

          <div className="monthly-striped-track">
            <div 
              className="monthly-striped-fill" 
              style={{ width: '82%' }}
              title="82% da meta mensal atingida"
            />
          </div>
        </div>
      </footer>

      {/* Modal Interativo do Calendário (Acessado via Botão "Calendário") */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        data={fullData}
      />
    </div>
  );
};

export default Home;

