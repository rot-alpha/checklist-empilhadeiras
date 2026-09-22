import React, { useState, useMemo } from 'react';
import { 
  getMachineDailyUtilization, 
  getMachineMonthlyUtilization, 
  extractDateStr,
  extractDayKey,
  MONTH_NAMES 
} from '../data/csvParser';
import MonthlyUsageModal from './MonthlyUsageModal';
import DailyInspectionModal from './DailyInspectionModal';
import './MachineCalendar.css';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const MachineCalendar = ({ machineName, machineRows = [] }) => {
  // 1. Group raw machine inspections by dayKey (YYYY-MM-DD)
  const inspectionsByDay = useMemo(() => {
    const map = {};
    machineRows.forEach(row => {
      const rawDate = extractDateStr(row);
      const dayKey = extractDayKey(rawDate);
      if (!dayKey) return;
      if (!map[dayKey]) {
        map[dayKey] = [];
      }
      map[dayKey].push(row);
    });
    return map;
  }, [machineRows]);

  // 2. Calculate day-by-day utilization
  const dailyMap = useMemo(() => {
    return getMachineDailyUtilization(machineRows);
  }, [machineRows]);

  // 3. Determine available months from dailyMap and inspection days
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    Object.keys(dailyMap).forEach(dayKey => {
      const mKey = dayKey.substring(0, 7);
      monthsSet.add(mKey);
    });
    Object.keys(inspectionsByDay).forEach(dayKey => {
      const mKey = dayKey.substring(0, 7);
      monthsSet.add(mKey);
    });
    return Array.from(monthsSet).sort().reverse();
  }, [dailyMap, inspectionsByDay]);

  // Selected month state (defaults to most recent available)
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || '');
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);

  // Daily Inspection Modal state
  const [selectedDailyData, setSelectedDailyData] = useState(null);
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);

  // Sync selectedMonth if availableMonths changes
  React.useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  // 4. Compute monthly aggregation for the selected month
  const monthlyData = useMemo(() => {
    if (!selectedMonth) return null;
    return getMachineMonthlyUtilization(dailyMap, selectedMonth);
  }, [dailyMap, selectedMonth]);

  // Format month name for display (e.g. "Setembro 2026")
  const formattedMonthLabel = useMemo(() => {
    if (!selectedMonth) return '';
    const [year, month] = selectedMonth.split('-');
    const mIdx = parseInt(month, 10) - 1;
    return `${MONTH_NAMES[mIdx] || month} ${year}`;
  }, [selectedMonth]);

  // Build the calendar matrix for the selected month
  const calendarCells = useMemo(() => {
    if (!selectedMonth) return [];
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;

    // First day of month & total days in month
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    // Padding for empty days before the 1st
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ empty: true, key: `empty-pre-${i}` });
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayPad = String(day).padStart(2, '0');
      const dayKey = `${selectedMonth}-${dayPad}`;
      const usageInfo = dailyMap[dayKey] || null;
      const dayInspections = inspectionsByDay[dayKey] || [];
      const hasInspection = dayInspections.length > 0;
      const hasFault = dayInspections.some(r => Object.values(r).includes('Não Conforme'));

      cells.push({
        empty: false,
        day,
        dayKey,
        usageInfo,
        dayInspections,
        hasInspection,
        hasFault,
        key: dayKey,
      });
    }

    return cells;
  }, [selectedMonth, dailyMap, inspectionsByDay]);

  const handleDayClick = (cell) => {
    if (cell.empty) return;
    if (!cell.hasInspection && (!cell.usageInfo || cell.usageInfo.hours === null)) {
      return; // No activity on this day
    }

    setSelectedDailyData({
      dayKey: cell.dayKey,
      dayRows: cell.dayInspections,
      usageInfo: cell.usageInfo,
    });
    setIsDailyModalOpen(true);
  };

  if (availableMonths.length === 0) {
    return (
      <div className="machine-calendar-empty">
        Nenhum dado de horímetro ou checklist disponível para esta máquina.
      </div>
    );
  }

  return (
    <div className="machine-calendar-card">
      {/* Calendar Header */}
      <div className="machine-calendar-header">
        <div className="machine-calendar-title-wrap">
          <div className="machine-calendar-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div>
            <h3 className="machine-calendar-title">Calendário de Utilização e Inspeções</h3>
            <span className="machine-calendar-subtitle">
              Consumo de horímetro e relatórios diários (clique no dia para detalhar)
            </span>
          </div>
        </div>

        <div className="machine-calendar-actions">
          {/* Month Selector */}
          <div className="machine-month-selector">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="machine-month-select"
              aria-label="Selecionar mês"
            >
              {availableMonths.map(mKey => {
                const [y, m] = mKey.split('-');
                const label = `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
                return (
                  <option key={mKey} value={mKey}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Compilado do Mês Button */}
          <button 
            className="compiled-month-btn"
            onClick={() => setIsMonthlyModalOpen(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Compilado do Mês
          </button>
        </div>
      </div>

      {/* Numeric Highlights of the Selected Month */}
      {monthlyData && (
        <div className="machine-calendar-kpis">
          <div className="machine-kpi-item highlight">
            <span className="machine-kpi-item__lbl">Total do Horímetro Mensal</span>
            <div className="machine-kpi-item__val-wrap">
              <span className="machine-kpi-item__val">{monthlyData.totalHours.toLocaleString('pt-BR')}</span>
              <span className="machine-kpi-item__unit">horas</span>
            </div>
            <span className="machine-kpi-item__sub">acumulado em {formattedMonthLabel}</span>
          </div>

          <div className="machine-kpi-item">
            <span className="machine-kpi-item__lbl">Média Diária</span>
            <div className="machine-kpi-item__val-wrap">
              <span className="machine-kpi-item__val">{monthlyData.avgDailyHours.toLocaleString('pt-BR')}</span>
              <span className="machine-kpi-item__unit">h/dia</span>
            </div>
            <span className="machine-kpi-item__sub">{monthlyData.activeDays} dias com atividade</span>
          </div>

          <div className="machine-kpi-item">
            <span className="machine-kpi-item__lbl">Pico Diário</span>
            <div className="machine-kpi-item__val-wrap">
              <span className="machine-kpi-item__val">{monthlyData.maxDayHours.toLocaleString('pt-BR')}</span>
              <span className="machine-kpi-item__unit">horas</span>
            </div>
            <span className="machine-kpi-item__sub">máximo operado em 1 dia</span>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="calendar-grid-wrapper">
        <div className="calendar-grid-weekdays">
          {WEEKDAYS.map(w => (
            <div key={w} className="calendar-weekday-cell">{w}</div>
          ))}
        </div>

        <div className="calendar-grid-days">
          {calendarCells.map(cell => {
            if (cell.empty) {
              return <div key={cell.key} className="calendar-day-cell is-empty" />;
            }

            const info = cell.usageInfo;
            const hasHours = info && info.hours !== null && info.hours > 0;
            const isPending = info && info.pending;
            const isClickable = cell.hasInspection || hasHours;

            const tooltipText = cell.hasInspection
              ? `Clique para ver o relatório: ${cell.dayInspections.length} inspeção(ões)${cell.hasFault ? ' (com não conformidade)' : ' (conforme)'}`
              : hasHours 
                ? `Horas apuradas: ${info.hours}h`
                : undefined;

            return (
              <div 
                key={cell.key} 
                onClick={() => isClickable && handleDayClick(cell)}
                title={tooltipText}
                className={`calendar-day-cell ${hasHours ? 'has-usage' : ''} ${isPending ? 'is-pending' : ''} ${isClickable ? 'is-clickable' : ''} ${cell.hasInspection ? 'has-inspection' : ''}`}
              >
                <div className="calendar-day-header-cell">
                  <span className="calendar-day-num">{cell.day}</span>
                  {cell.hasInspection && (
                    <span 
                      className={`calendar-inspection-dot ${cell.hasFault ? 'has-fault' : 'all-ok'}`} 
                      title={cell.hasFault ? 'Possui não conformidades' : 'Todas as inspeções conformes'}
                    />
                  )}
                </div>

                {hasHours && (
                  <div className="calendar-usage-badge">
                    <span className="usage-hours">+{info.hours}h</span>
                    <span className="usage-sub">utilizado</span>
                  </div>
                )}

                {isPending && !hasHours && (
                  <div className="calendar-pending-badge" title="Aguardando próxima leitura de amanhã para cálculo">
                    <span>Em and.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Subtle helper notice below calendar */}
        <div className="calendar-bottom-hint">
          <span className="hint-indicator">
            <span className="calendar-inspection-dot all-ok" /> Conforme
          </span>
          <span className="hint-indicator">
            <span className="calendar-inspection-dot has-fault" /> Com Não-Conformidade
          </span>
          <span className="hint-text">
            💡 Dica: Clique no dia desejado para ver o checklist detalhado com respostas e operador.
          </span>
        </div>
      </div>

      {/* Modal for Monthly Compilation */}
      {isMonthlyModalOpen && (
        <MonthlyUsageModal
          isOpen={isMonthlyModalOpen}
          onClose={() => setIsMonthlyModalOpen(false)}
          machineName={machineName}
          monthLabel={formattedMonthLabel}
          monthlyData={monthlyData}
        />
      )}

      {/* Modal for Daily Inspection Report */}
      {isDailyModalOpen && selectedDailyData && (
        <DailyInspectionModal
          isOpen={isDailyModalOpen}
          onClose={() => {
            setIsDailyModalOpen(false);
            setSelectedDailyData(null);
          }}
          machineName={machineName}
          dayKey={selectedDailyData.dayKey}
          dayRows={selectedDailyData.dayRows}
          usageInfo={selectedDailyData.usageInfo}
        />
      )}
    </div>
  );
};

export default MachineCalendar;

