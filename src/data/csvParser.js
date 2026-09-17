import Papa from 'papaparse';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRuiTWVDNhAVtbah-F5-1ReFHH57pkhlM1mtrQOOh6nUNXB2wof8AMjaP_Mnjk6K5hU4rzs6OvhAZit/pub?output=csv';

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const IGNORE_KEYS = [
  'Carimbo de data/hora',
  'Data e Hora da Inspeção',
  'Nome do Operador',
  'Turno (Manhã / Tarde)',
  'Modelo',
  'Leitura do Horímetro Inicial',
  'Observações sobre o estado geral da empilhadeira. (Opcional)'
];

export function extractMonthKey(dateStr) {
  if (!dateStr) return null;
  const match = String(dateStr).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const month = match[2].padStart(2, '0');
  const year = match[3];
  return `${year}-${month}`;
}

export function fetchCSVData() {
  return new Promise((resolve, reject) => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      complete: (results) => {
        const data = results.data.filter(row => row.Modelo);
        resolve(data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

export function getAvailableMonths(data) {
  const monthsSet = new Set();
  data.forEach(row => {
    const raw = row['Data e Hora da Inspeção'] || row['Carimbo de data/hora'];
    const key = extractMonthKey(raw);
    if (key) monthsSet.add(key);
  });

  return Array.from(monthsSet).sort().reverse().map(key => {
    const [y, m] = key.split('-');
    const monthName = MONTH_NAMES[parseInt(m, 10) - 1];
    return { key, label: `${monthName} ${y}` };
  });
}

export function filterByMonth(data, monthKey) {
  if (!monthKey || monthKey === 'todos') return data;
  return data.filter(row => {
    const raw = row['Data e Hora da Inspeção'] || row['Carimbo de data/hora'];
    return extractMonthKey(raw) === monthKey;
  });
}

export function getFleetModels(data) {
  const latest = {};
  data.forEach(row => {
    latest[row.Modelo] = row;
  });
  return Object.values(latest);
}

export function calculateConformity(rows) {
  if (!rows || rows.length === 0) return 0;
  let totalFields = 0;
  let conformeFields = 0;

  rows.forEach(row => {
    Object.entries(row).forEach(([key, value]) => {
      if (!IGNORE_KEYS.includes(key) && (value === 'Conforme' || value === 'Não Conforme')) {
        totalFields++;
        if (value === 'Conforme') conformeFields++;
      }
    });
  });

  return totalFields > 0 ? Math.round((conformeFields / totalFields) * 100) : 100;
}

export function getTopFaults(rows, limit = 5) {
  const faults = {};
  rows.forEach(row => {
    Object.entries(row).forEach(([key, value]) => {
      if (!IGNORE_KEYS.includes(key) && value === 'Não Conforme') {
        faults[key] = (faults[key] || 0) + 1;
      }
    });
  });

  return Object.entries(faults)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

export function extractDateStr(row) {
  return row['Data e Hora da Inspeção'] || row['Carimbo de data/hora'] || '';
}

export function extractDayKey(dateStr) {
  if (!dateStr) return null;
  const match = String(dateStr).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const day = match[1].padStart(2, '0');
  const month = match[2].padStart(2, '0');
  const year = match[3];
  return `${year}-${month}-${day}`;
}

/**
 * Returns engagement data grouped by month.
 * Structure: { 'SET 2026': [{ name, days, totalInspections }, ...], ... }
 * Sorted by month descending, operators sorted by days descending.
 */
export function getEngagementByMonth(data) {
  // Group: monthKey -> operatorName -> Set of dayKeys
  const monthOps = {};

  data.forEach(row => {
    const raw = extractDateStr(row);
    const monthKey = extractMonthKey(raw);
    const dayKey = extractDayKey(raw);
    const operator = (row['Nome do Operador'] || '').trim();
    if (!monthKey || !dayKey || !operator) return;

    if (!monthOps[monthKey]) monthOps[monthKey] = {};
    if (!monthOps[monthKey][operator]) monthOps[monthKey][operator] = new Set();
    monthOps[monthKey][operator].add(dayKey);
  });

  // Sort months descending, build output
  const sortedMonthKeys = Object.keys(monthOps).sort().reverse();
  const result = [];

  sortedMonthKeys.forEach(monthKey => {
    const [y, m] = monthKey.split('-');
    const monthName = MONTH_NAMES[parseInt(m, 10) - 1];
    const label = `${monthName.substring(0, 3).toUpperCase()} ${y}`;

    const operators = Object.entries(monthOps[monthKey])
      .map(([name, daySet]) => ({ name, days: daySet.size }))
      .sort((a, b) => b.days - a.days);

    result.push({ monthKey, label, operators });
  });

  return result;
}

/**
 * Returns detailed calendar data for a specific operator.
 * Returns array of { dayKey, conformity } sorted by date.
 */
export function getOperatorCalendarDetail(data, operatorName) {
  // Filter rows for this operator
  const operatorRows = data.filter(row =>
    (row['Nome do Operador'] || '').trim() === operatorName
  );

  // Group by day
  const dayGroups = {};
  operatorRows.forEach(row => {
    const raw = extractDateStr(row);
    const dayKey = extractDayKey(raw);
    if (!dayKey) return;
    if (!dayGroups[dayKey]) dayGroups[dayKey] = [];
    dayGroups[dayKey].push(row);
  });

  // Calculate conformity per day
  return Object.entries(dayGroups)
    .map(([dayKey, rows]) => ({
      dayKey,
      date: dayKey.split('-').reverse().join('/'),
      conformity: calculateConformity(rows),
      inspections: rows.length,
    }))
    .sort((a, b) => b.dayKey.localeCompare(a.dayKey));
}

/**
 * Returns hourmeter utilization per machine (cumulative).
 * Reads the hourmeter from all rows and returns the max per machine.
 */
export function getHorimeterUtilization(data) {
  const machineHours = {};

  data.forEach(row => {
    const modelo = row.Modelo;
    if (!modelo) return;
    const raw = row['Leitura do Horímetro Inicial'] || '0';
    const value = parseFloat(String(raw).replace(',', '.'));
    if (isNaN(value)) return;

    if (!machineHours[modelo]) {
      machineHours[modelo] = { max: value, min: Infinity, count: 0, sum: 0 };
    }
    machineHours[modelo].max = Math.max(machineHours[modelo].max, value);
    machineHours[modelo].min = Math.min(machineHours[modelo].min, value);
    machineHours[modelo].count++;
    machineHours[modelo].sum += value;
  });

  const allMaxes = Object.values(machineHours).map(m => m.max);
  const globalMax = Math.max(...allMaxes, 1);

  return Object.entries(machineHours)
    .map(([modelo, stats]) => ({
      modelo,
      maxHours: Math.round(stats.max),
      minHours: Math.round(stats.min),
      avgHours: Math.round(stats.sum / stats.count),
      percentage: Math.round((stats.max / globalMax) * 100),
    }))
    .sort((a, b) => b.maxHours - a.maxHours);
}

/**
 * Calculates day-by-day utilization for a machine.
 * The utilization of day D is defined as: Reading(D+1) - Reading(D).
 * The last recorded day has hours = null (waiting for next day's reading).
 */
export function getMachineDailyUtilization(machineRows) {
  // 1. Group records by dayKey (YYYY-MM-DD)
  const dayGroups = {};

  machineRows.forEach(row => {
    const rawDate = extractDateStr(row);
    const dayKey = extractDayKey(rawDate);
    if (!dayKey) return;

    const rawH = row['Leitura do Horímetro Inicial'] || '';
    const hVal = parseFloat(String(rawH).replace(',', '.'));
    if (isNaN(hVal)) return;

    if (!dayGroups[dayKey]) {
      dayGroups[dayKey] = [];
    }
    dayGroups[dayKey].push({
      rawDate,
      hourmeter: hVal,
      row,
    });
  });

  // 2. For each day, take the earliest inspection reading of the day
  const sortedDays = Object.keys(dayGroups).sort(); // chronological ascending
  const dayReadings = sortedDays.map(dayKey => {
    const items = dayGroups[dayKey];
    // Take the minimum reading of the day as start of day
    const minReading = Math.min(...items.map(i => i.hourmeter));
    const maxReading = Math.max(...items.map(i => i.hourmeter));
    return {
      dayKey,
      startReading: minReading,
      endReading: maxReading,
      items,
    };
  });

  // 3. Compute delta between consecutive days: delta = Reading(day i + 1) - Reading(day i)
  const dailyMap = {};
  for (let i = 0; i < dayReadings.length; i++) {
    const current = dayReadings[i];
    const next = dayReadings[i + 1];

    let hours = null;
    let pending = true;

    if (next) {
      const delta = next.startReading - current.startReading;
      // Filter out negative anomalies (e.g. meter replacement or typo)
      hours = delta >= 0 ? Math.round(delta * 10) / 10 : 0;
      pending = false;
    }

    dailyMap[current.dayKey] = {
      dayKey: current.dayKey,
      dateFormatted: current.dayKey.split('-').reverse().join('/'),
      hours,
      pending,
      startReading: current.startReading,
      nextReading: next ? next.startReading : null,
      inspections: current.items.length,
    };
  }

  return dailyMap;
}

/**
 * Returns monthly summary and daily breakdown for a specific machine and month.
 */
export function getMachineMonthlyUtilization(dailyMap, monthKey) {
  // monthKey format: 'YYYY-MM'
  const entries = Object.values(dailyMap).filter(item => item.dayKey.startsWith(monthKey));
  
  // Sort days ascending for chart (01 to 31)
  entries.sort((a, b) => a.dayKey.localeCompare(b.dayKey));

  let totalHours = 0;
  let activeDays = 0;
  let maxDayHours = 0;

  entries.forEach(entry => {
    if (entry.hours !== null && entry.hours > 0) {
      totalHours += entry.hours;
      activeDays++;
      if (entry.hours > maxDayHours) {
        maxDayHours = entry.hours;
      }
    }
  });

  totalHours = Math.round(totalHours * 10) / 10;
  const avgDailyHours = activeDays > 0 ? Math.round((totalHours / activeDays) * 10) / 10 : 0;

  return {
    monthKey,
    totalHours,
    activeDays,
    avgDailyHours,
    maxDayHours,
    dailyList: entries,
  };
}

export function getMachineStatus(row) {
  const criticos = ['Botão de Emergência', 'Funcionamento de Direção', 'Cinto de Segurança', 'Sistema de Elevação/Abaixamento'];
  let isCritical = false;
  let isAlert = false;

  for (const [key, value] of Object.entries(row)) {
    if (value === 'Não Conforme') {
      if (criticos.includes(key) || key.includes('VAZAMENTO') || key.includes('Óleo')) {
        isCritical = true;
      } else {
        isAlert = true;
      }
    }
  }

  if (isCritical) return { key: 'critical', label: 'Parada', color: 'var(--status-critical)' };
  if (isAlert) return { key: 'alert', label: 'Atenção', color: 'var(--status-alert)' };
  return { key: 'ok', label: 'Disponível', color: 'var(--status-ok)' };
}
