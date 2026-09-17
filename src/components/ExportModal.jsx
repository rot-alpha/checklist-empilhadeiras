import React, { useState } from 'react';
import PptxGenJS from 'pptxgenjs';
import { MONTH_NAMES, filterByMonth, calculateConformity, getTopFaults, getAvailableMonths } from '../data/csvParser';
import './ExportModal.css';

const THEMES = [
  { id: 'corporate', label: 'Corporativo Azul', primary: '2563EB', secondary: '1E3A5F', bg: 'F5F5F7', text: '111111' },
  { id: 'dark', label: 'Minimalista Escuro', primary: '3B82F6', secondary: 'FB923C', bg: '0D0D0D', text: 'F5F5F5' },
  { id: 'clean', label: 'Clean Branco', primary: '111111', secondary: 'F97316', bg: 'FFFFFF', text: '111111' },
];

const ExportModal = ({ isOpen, onClose, fullData, machines }) => {
  const [selectedMonth, setSelectedMonth] = useState('todos');
  const [selectedTheme, setSelectedTheme] = useState('corporate');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const availableMonths = getAvailableMonths(fullData);

  const getMonthLabel = (key) => {
    if (key === 'todos') return 'Todos os Meses (Compilado)';
    const found = availableMonths.find(m => m.key === key);
    return found ? found.label : key;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const theme = THEMES.find(t => t.id === selectedTheme) || THEMES[0];
      const data = filterByMonth(fullData, selectedMonth);
      const monthLabel = getMonthLabel(selectedMonth);

      const pptx = new PptxGenJS();
      pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 });
      pptx.layout = 'WIDE';

      // ── Slide 1: Cover ──
      const cover = pptx.addSlide();
      cover.background = { color: theme.primary };

      cover.addText('Relatório de Conformidade', {
        x: 1, y: 1.5, w: 11, h: 1.2,
        fontSize: 36, fontFace: 'Calibri', color: 'FFFFFF',
        bold: true, align: 'left',
      });

      cover.addText('Checklist de Empilhadeiras', {
        x: 1, y: 2.7, w: 11, h: 0.8,
        fontSize: 20, fontFace: 'Calibri', color: 'FFFFFF',
        bold: false, align: 'left', italic: true,
      });

      cover.addText(monthLabel, {
        x: 1, y: 4.0, w: 5, h: 0.6,
        fontSize: 16, fontFace: 'Calibri', color: 'FFFFFF',
        bold: true, align: 'left',
      });

      cover.addText(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, {
        x: 1, y: 6.0, w: 5, h: 0.4,
        fontSize: 11, fontFace: 'Calibri', color: 'CCCCCC',
      });

      // ── Slide 2: Overview ──
      const overview = pptx.addSlide();
      overview.background = { color: theme.bg };

      overview.addText('Visão Geral da Frota', {
        x: 0.8, y: 0.4, w: 11, h: 0.7,
        fontSize: 24, fontFace: 'Calibri', color: theme.primary,
        bold: true,
      });

      const generalConformity = calculateConformity(data);
      const totalInspections = data.length;
      const topFaults = getTopFaults(data, 5);

      const summaryRows = [
        ['Métrica', 'Valor'],
        ['Total de Inspeções', String(totalInspections)],
        ['Conformidade Geral', `${generalConformity}%`],
        ['Não-Conformidades Únicas', String(topFaults.length)],
        ['Período', monthLabel],
      ];

      overview.addTable(summaryRows, {
        x: 0.8, y: 1.4, w: 5.5,
        fontSize: 12, fontFace: 'Calibri',
        border: { pt: 0.5, color: 'CCCCCC' },
        colW: [3, 2.5],
        rowH: 0.45,
        autoPage: false,
        color: theme.text,
        headerRow: true,
      });

      if (topFaults.length > 0) {
        overview.addText('Top Falhas Detectadas', {
          x: 7, y: 1.2, w: 5, h: 0.5,
          fontSize: 14, fontFace: 'Calibri', color: theme.primary,
          bold: true,
        });

        const faultRows = [['Item', 'Ocorrências']];
        topFaults.forEach(([item, count]) => {
          faultRows.push([item, String(count)]);
        });

        overview.addTable(faultRows, {
          x: 7, y: 1.8, w: 5.5,
          fontSize: 11, fontFace: 'Calibri',
          border: { pt: 0.5, color: 'CCCCCC' },
          colW: [3.5, 2],
          rowH: 0.4,
          autoPage: false,
          color: theme.text,
          headerRow: true,
        });
      }

      // ── Slides por Máquina ──
      machines.forEach(machine => {
        const machineData = data.filter(row => row.Modelo === machine);
        const slide = pptx.addSlide();
        slide.background = { color: theme.bg };

        slide.addText(machine, {
          x: 0.8, y: 0.4, w: 10, h: 0.7,
          fontSize: 22, fontFace: 'Calibri', color: theme.primary,
          bold: true,
        });

        const conformity = calculateConformity(machineData);
        const machineFaults = getTopFaults(machineData, 5);

        // Conformity badge
        const badgeColor = conformity >= 80 ? '22C55E' : conformity >= 50 ? 'F59E0B' : 'EF4444';

        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.8, y: 1.4, w: 3, h: 1.5,
          fill: { color: badgeColor + '15' },
          line: { color: badgeColor, width: 1.5 },
          rectRadius: 0.15,
        });

        slide.addText(`${conformity}%`, {
          x: 0.8, y: 1.5, w: 3, h: 0.8,
          fontSize: 36, fontFace: 'Calibri', color: badgeColor,
          bold: true, align: 'center',
        });

        slide.addText('Conformidade', {
          x: 0.8, y: 2.2, w: 3, h: 0.5,
          fontSize: 12, fontFace: 'Calibri', color: theme.text,
          align: 'center',
        });

        // Machine info
        const infoRows = [
          ['Inspeções no período', String(machineData.length)],
          ['Status', conformity >= 80 ? 'Disponível' : conformity >= 50 ? 'Atenção' : 'Parada'],
        ];

        slide.addTable(infoRows, {
          x: 4.5, y: 1.5, w: 4,
          fontSize: 12, fontFace: 'Calibri',
          border: { pt: 0.5, color: 'CCCCCC' },
          colW: [2.2, 1.8],
          rowH: 0.4,
          color: theme.text,
        });

        // Faults list
        if (machineFaults.length > 0) {
          slide.addText('Não-Conformidades', {
            x: 0.8, y: 3.5, w: 10, h: 0.5,
            fontSize: 14, fontFace: 'Calibri', color: theme.primary,
            bold: true,
          });

          const faultRows = [['Item', 'Ocorrências']];
          machineFaults.forEach(([item, count]) => {
            faultRows.push([item, String(count)]);
          });

          slide.addTable(faultRows, {
            x: 0.8, y: 4.1, w: 8,
            fontSize: 11, fontFace: 'Calibri',
            border: { pt: 0.5, color: 'CCCCCC' },
            colW: [5.5, 2.5],
            rowH: 0.38,
            color: theme.text,
            headerRow: true,
          });
        } else {
          slide.addText('✓ Nenhuma não-conformidade no período', {
            x: 0.8, y: 3.5, w: 10, h: 0.5,
            fontSize: 13, fontFace: 'Calibri', color: '22C55E',
            bold: true,
          });
        }
      });

      // Save
      const fileName = `Relatorio_Conformidade_${selectedMonth === 'todos' ? 'Compilado' : selectedMonth}.pptx`;
      await pptx.writeFile({ fileName });
    } catch (err) {
      console.error('Erro ao gerar PPTX:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="export-overlay" onClick={onClose}>
      <div className="export-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="export-modal__header">
          <div>
            <h2 className="export-modal__title">Exportar Relatório</h2>
            <p className="export-modal__subtitle">Gere um arquivo PowerPoint editável</p>
          </div>
          <button className="export-modal__close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="export-modal__body">
          {/* Month selector */}
          <div className="export-field">
            <label className="export-field__label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Período
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="export-field__select"
            >
              <option value="todos">Compilado (Todos os Meses)</option>
              {availableMonths.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Theme selector */}
          <div className="export-field">
            <label className="export-field__label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="6.5" r="2.5"/>
                <path d="M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5z"/>
              </svg>
              Tema Visual
            </label>
            <div className="export-themes">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  className={`export-theme-card ${selectedTheme === t.id ? 'export-theme-card--active' : ''}`}
                  onClick={() => setSelectedTheme(t.id)}
                >
                  <div className="export-theme-preview">
                    <div className="theme-swatch" style={{ background: `#${t.primary}` }} />
                    <div className="theme-swatch" style={{ background: `#${t.secondary}` }} />
                    <div className="theme-swatch" style={{ background: `#${t.bg}`, border: '1px solid #ccc' }} />
                  </div>
                  <span className="export-theme-label">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="export-modal__footer">
          <button className="export-btn export-btn--cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="export-btn export-btn--generate"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="export-spinner" />
                Gerando...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Gerar e Baixar .pptx
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
