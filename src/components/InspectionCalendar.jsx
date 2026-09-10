import React, { useState, useMemo } from 'react';
import './InspectionCalendar.css';

// Auxiliar: Normaliza data para chave YYYY-MM-DD
function parseDateKey(rawDate) {
  if (!rawDate) return null;
  const match = String(rawDate).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const day = match[1].padStart(2, '0');
  const month = match[2].padStart(2, '0');
  const year = match[3];
  return `${year}-${month}-${day}`;
}

// Auxiliar: Extrai hora
function parseTime(rawDate) {
  if (!rawDate) return '—';
  const match = String(rawDate).match(/\b(\d{1,2}:\d{2}(?::\d{2})?)\b/);
  return match ? match[1] : '—';
}

// Auxiliar: Avalia o status e não-conformidades de uma linha
function evaluateRowStatus(row) {
  const criticos = ['Botão de Emergência', 'Funcionamento de Direção', 'Cinto de Segurança', 'Sistema de Elevação/Abaixamento'];
  const ignoreKeys = [
    'Carimbo de data/hora',
    'Data e Hora da Inspeção',
    'Nome do Operador',
    'Turno (Manhã / Tarde)',
    'Modelo',
    'Leitura do Horímetro Inicial',
    'Observações sobre o estado geral da empilhadeira. (Opcional)'
  ];

  let hasCritical = false;
  let hasAlert = false;
  const faults = [];

  Object.entries(row).forEach(([key, value]) => {
    if (!ignoreKeys.includes(key) && value === 'Não Conforme') {
      faults.push(key);
      if (criticos.includes(key) || key.includes('VAZAMENTO') || key.includes('Óleo')) {
        hasCritical = true;
      } else {
        hasAlert = true;
      }
    }
  });

  if (hasCritical) return { status: 'critical', label: 'Parada', faults };
  if (hasAlert) return { status: 'alert', label: 'Atenção', faults };
  return { status: 'ok', label: 'Disponível', faults: [] };
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEK_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const InspectionCalendar = ({ data = [] }) => {
  // Indexa os dados por chave YYYY-MM-DD
  const { dateMap, initialYear, initialMonth } = useMemo(() => {
    const map = {};
    let latestYear = 2026;
    let latestMonth = 8; // Setembro (0-indexed)
    let maxTimestamp = 0;

    data.forEach(row => {
      const raw = row['Data e Hora da Inspeção'] || row['Carimbo de data/hora'];
      const dateKey = parseDateKey(raw);
      if (!dateKey) return;

      if (!map[dateKey]) {
        map[dateKey] = [];
      }

      const evalResult = evaluateRowStatus(row);
      map[dateKey].push({
        ...row,
        _time: parseTime(raw),
        _eval: evalResult,
      });

      // Detecta o mês mais recente com registros
      const [y, m, d] = dateKey.split('-').map(Number);
      const timeVal = new Date(y, m - 1, d).getTime();
      if (timeVal > maxTimestamp) {
        maxTimestamp = timeVal;
        latestYear = y;
        latestMonth = m - 1;
      }
    });

    return { dateMap: map, initialYear: latestYear, initialMonth: latestMonth };
  }, [data]);

  // Estado do mês visível e do dia selecionado
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [selectedDay, setSelectedDay] = useState(null); // formato YYYY-MM-DD

  // Navegação de mês
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Montagem do grid do mês
  const calendarDays = useMemo(() => {
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    // Primeiro dia da semana (0 = domingo -> ajusta para 0 = segunda)
    const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

    const days = [];

    // Células vazias antes do primeiro dia
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ empty: true, key: `empty-pre-${i}` });
    }

    // Dias do mês
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dateKey = `${currentYear}-${monthStr}-${dayStr}`;
      const records = dateMap[dateKey] || [];

      // Determina o status geral do dia
      let dayStatus = 'none';
      if (records.length > 0) {
        const hasCritical = records.some(r => r._eval.status === 'critical');
        const hasAlert = records.some(r => r._eval.status === 'alert');
        if (hasCritical) dayStatus = 'critical';
        else if (hasAlert) dayStatus = 'alert';
        else dayStatus = 'ok';
      }

      days.push({
        empty: false,
        dayNum: d,
        dateKey,
        recordsCount: records.length,
        records,
        dayStatus,
        key: dateKey,
      });
    }

    return days;
  }, [currentYear, currentMonth, dateMap]);

  // Compilado do Mês (estatísticas agregadas do mês corrente)
  const monthSummary = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-`;
    let totalChecklists = 0;
    let activeDays = 0;
    let okCount = 0;
    let alertCount = 0;
    let criticalCount = 0;
    let totalFaults = 0;
    const modelCounts = {};

    Object.entries(dateMap).forEach(([dateKey, records]) => {
      if (dateKey.startsWith(monthPrefix)) {
        if (records.length > 0) activeDays++;
        records.forEach(r => {
          totalChecklists++;
          if (r._eval.status === 'ok') okCount++;
          else if (r._eval.status === 'alert') alertCount++;
          else if (r._eval.status === 'critical') criticalCount++;

          totalFaults += r._eval.faults.length;

          const m = r['Modelo'] || 'Outros';
          modelCounts[m] = (modelCounts[m] || 0) + 1;
        });
      }
    });

    const complianceRate = totalChecklists > 0
      ? Math.round((okCount / totalChecklists) * 100)
      : 100;

    return {
      totalChecklists,
      activeDays,
      complianceRate,
      okCount,
      alertCount,
      criticalCount,
      totalFaults,
      uniqueModels: Object.keys(modelCounts).length,
      topModels: Object.entries(modelCounts).sort((a, b) => b[1] - a[1]).slice(0, 3),
    };
  }, [dateMap, currentYear, currentMonth]);

  // Lista do dia selecionado
  const selectedRecords = useMemo(() => {
    if (!selectedDay) return [];
    return dateMap[selectedDay] || [];
  }, [selectedDay, dateMap]);

  // Formatação de data amigável DD/MM/AAAA
  const formatFriendlyDate = (dateKey) => {
    if (!dateKey) return '';
    const [y, m, d] = dateKey.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="inspection-calendar-container">
      {/* Cabeçalho de Navegação */}
      <div className="calendar-top-header">
        <div className="month-selector">
          <button
            type="button"
            className="cal-nav-btn"
            onClick={handlePrevMonth}
            title="Mês anterior"
          >
            ‹
          </button>
          <span className="current-month-title">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <button
            type="button"
            className="cal-nav-btn"
            onClick={handleNextMonth}
            title="Próximo mês"
          >
            ›
          </button>
        </div>

        <div className="header-view-toggle">
          {selectedDay && (
            <button
              type="button"
              className="view-month-btn"
              onClick={() => setSelectedDay(null)}
            >
              📊 Ver Compilado do Mês
            </button>
          )}
        </div>
      </div>

      <div className="calendar-main-layout">
        {/* Lado Esquerdo: Grid do Calendário */}
        <div className="calendar-grid-card">
          <div className="calendar-weekdays">
            {WEEK_DAYS.map(day => (
              <div key={day} className="weekday-cell">{day}</div>
            ))}
          </div>

          <div className="calendar-days-grid">
            {calendarDays.map(item => {
              if (item.empty) {
                return <div key={item.key} className="day-cell empty-cell" />;
              }

              const isSelected = selectedDay === item.dateKey;
              const hasChecklist = item.recordsCount > 0;

              return (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => setSelectedDay(item.dateKey)}
                  className={`day-cell ${hasChecklist ? 'has-data' : ''} ${isSelected ? 'selected' : ''} status-${item.dayStatus}`}
                >
                  <span className="day-number">{item.dayNum}</span>

                  {hasChecklist && (
                    <div className="day-badge-container">
                      <span className="day-records-pill">
                        {item.recordsCount}
                      </span>
                      <span className={`status-dot dot-${item.dayStatus}`} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="calendar-legend">
            <span className="legend-item">
              <span className="status-dot dot-ok" /> 100% Conforme
            </span>
            <span className="legend-item">
              <span className="status-dot dot-alert" /> Com Alertas
            </span>
            <span className="legend-item">
              <span className="status-dot dot-critical" /> Parada/Crítico
            </span>
          </div>
        </div>

        {/* Lado Direito: Detalhes do Dia Selecionado OU Compilado do Mês */}
        <div className="calendar-details-card">
          {selectedDay ? (
            /* VISÃO DO DIA SELECIONADO */
            <div className="day-details-panel">
              <div className="panel-header">
                <div>
                  <span className="panel-kicker">Checklists Lançados</span>
                  <h3 className="panel-main-title">Dia {formatFriendlyDate(selectedDay)}</h3>
                </div>
                <span className="records-count-tag">
                  {selectedRecords.length} {selectedRecords.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>

              {selectedRecords.length === 0 ? (
                <div className="empty-state-notice">
                  <p>Nenhum checklist registrado nesta data.</p>
                  <button
                    type="button"
                    className="btn-back-month"
                    onClick={() => setSelectedDay(null)}
                  >
                    Voltar ao compilado do mês
                  </button>
                </div>
              ) : (
                <div className="day-inspections-list">
                  {selectedRecords.map((rec, idx) => (
                    <div key={idx} className={`inspection-item-card status-${rec._eval.status}`}>
                      <div className="inspection-card-top">
                        <span className="inspection-model">{rec['Modelo'] || 'Modelo não informado'}</span>
                        <span className={`badge-status status-pill-${rec._eval.status}`}>
                          {rec._eval.label}
                        </span>
                      </div>

                      <div className="inspection-card-grid">
                        <div className="card-field">
                          <span className="field-label">Horário</span>
                          <span className="field-val">{rec._time}</span>
                        </div>
                        <div className="card-field">
                          <span className="field-label">Operador</span>
                          <span className="field-val">{rec['Nome do Operador'] || '—'}</span>
                        </div>
                        <div className="card-field">
                          <span className="field-label">Turno</span>
                          <span className="field-val">{rec['Turno (Manhã / Tarde)'] || '—'}</span>
                        </div>
                        <div className="card-field">
                          <span className="field-label">Horímetro</span>
                          <span className="field-val">{rec['Leitura do Horímetro Inicial'] || '—'}</span>
                        </div>
                      </div>

                      {rec._eval.faults.length > 0 && (
                        <div className="inspection-faults-box">
                          <span className="faults-title">Não-conformidades apontadas:</span>
                          <ul className="faults-tags">
                            {rec._eval.faults.map((f, fIdx) => (
                              <li key={fIdx} className="fault-tag">{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* COMPILADO DO MÊS */
            <div className="month-summary-panel">
              <div className="panel-header">
                <div>
                  <span className="panel-kicker">Relatório Consolidado</span>
                  <h3 className="panel-main-title">Compilado de {MONTH_NAMES[currentMonth]}</h3>
                </div>
                <span className="summary-status-tag">
                  {monthSummary.complianceRate}% Conformidade
                </span>
              </div>

              {/* KPI Cards */}
              <div className="kpi-cards-grid">
                <div className="kpi-mini-card">
                  <span className="kpi-number">{monthSummary.totalChecklists}</span>
                  <span className="kpi-label">Checklists Lançados</span>
                </div>
                <div className="kpi-mini-card">
                  <span className="kpi-number">{monthSummary.activeDays}</span>
                  <span className="kpi-label">Dias com Lançamentos</span>
                </div>
                <div className="kpi-mini-card">
                  <span className="kpi-number text-success">{monthSummary.okCount}</span>
                  <span className="kpi-label">Conformes (100% OK)</span>
                </div>
                <div className="kpi-mini-card">
                  <span className="kpi-number text-warning">{monthSummary.totalFaults}</span>
                  <span className="kpi-label">Falhas Apontadas</span>
                </div>
              </div>

              {/* Equipamentos Inspecionados */}
              <div className="summary-subbox">
                <h4 className="subbox-title">Equipamentos Ativos no Mês ({monthSummary.uniqueModels})</h4>
                {monthSummary.topModels.length === 0 ? (
                  <p className="no-records-msg">Nenhuma atividade registrada neste mês.</p>
                ) : (
                  <ul className="top-models-list">
                    {monthSummary.topModels.map(([mName, count]) => (
                      <li key={mName} className="top-model-item">
                        <span className="model-name">{mName}</span>
                        <span className="model-count-badge">{count} {count === 1 ? 'inspeção' : 'inspeções'}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="calendar-hint">
                💡 Clique em qualquer dia marcado no calendário para auditar as inspeções individuais.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InspectionCalendar;
