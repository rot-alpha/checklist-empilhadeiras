import React, { useState, useMemo } from 'react';
import { 
  getMachineDailyUtilization, 
  getMachineMonthlyUtilization, 
  MONTH_NAMES 
} from '../data/csvParser';
import MonthlyUsageModal from './MonthlyUsageModal';
import './MachineCalendar.css';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const MachineCalendar = ({ machineName, machineRows }) => {
  // 1. Calculate day-by-day utilization
  const dailyMap = useMemo(() => {
    return getMachineDailyUtilization(machineRows);
  }, [machineRows]);

  // 2. Determine available months from dailyMap
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    Object.keys(dailyMap).forEach(dayKey => {
      // dayKey is YYYY-MM-DD
      const mKey = dayKey.substring(0, 7);
      monthsSet.add(mKey);
    });
    return Array.from(monthsSet).sort().reverse();
  }, [dailyMap]);

  // Selected month state (defaults to most recent available)
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync selectedMonth if availableMonths changes
  React.useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  // 3. Compute monthly aggregation for the selected month
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

      cells.push({
        empty: false,
        day,
        dayKey,
        usageInfo,
        key: dayKey,
      });
    }

    return cells;
  }, [selectedMonth, dailyMap]);

  if (availableMonths.length === 0) {
    return (
      <div className="machine-calendar-empty">
        Nenhum dado de horímetro disponível para esta máquina.
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
            <h3 className="machine-calendar-title">Calendário de Utilização Diária</h3>
            <span className="machine-calendar-subtitle">Consumo de horímetro apurado dia a dia</span>
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
            onClick={() => setIsModalOpen(true)}
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

            return (
              <div 
                key={cell.key} 
                className={`calendar-day-cell ${hasHours ? 'has-usage' : ''} ${isPending ? 'is-pending' : ''}`}
              >
                <span className="calendar-day-num">{cell.day}</span>

                {hasHours && (
                  <div className="calendar-usage-badge">
                    <span className="usage-hours">+{info.hours}h</span>
                    <span className="usage-sub">utilizado</span>
                  </div>
                )}

                {isPending && (
                  <div className="calendar-pending-badge" title="Aguardando próxima leitura de amanhã para cálculo">
                    <span>Em and.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for Monthly Compilation */}
      {isModalOpen && (
        <MonthlyUsageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          machineName={machineName}
          monthLabel={formattedMonthLabel}
          monthlyData={monthlyData}
        />
      )}
    </div>
  );
};

export default MachineCalendar;
