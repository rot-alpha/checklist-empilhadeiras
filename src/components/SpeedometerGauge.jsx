import React from 'react';

/**
 * Componente SpeedometerGauge (Velocímetro SVG)
 * @param {number} value - Percentual de 0 a 100
 * @param {number} size - Largura em pixels (default: 130)
 * @param {boolean} showNeedle - Se exibe o ponteiro (default: true)
 * @param {string} label - Rótulo inferior (opcional)
 */
const SpeedometerGauge = ({ value = 0, size = 130, showNeedle = true, label = '' }) => {
  // Clampa valor entre 0 e 100
  const pct = Math.max(0, Math.min(100, Math.round(value)));

  // Determina cor de status
  const getColor = (v) => {
    if (v >= 80) return '#28A745'; // Verde
    if (v >= 50) return '#FFC107'; // Âmbar
    return '#DC3545';             // Vermelho
  };

  const activeColor = getColor(pct);

  // Parâmetros geométricos do SVG
  // Redesenhado para visualização limpa, sem sobreposição do texto com o pivô da agulha
  const cx = 80;
  const cy = 66;
  const r = 50;
  const strokeWidth = 9;
  
  // Comprimento do semicírculo: PI * r
  const arcLength = Math.PI * r;
  const strokeDashoffset = arcLength - (pct / 100) * arcLength;

  // Rotação da agulha: 0% = -90deg, 50% = 0deg, 100% = +90deg
  const needleAngle = -90 + (pct / 100) * 180;

  // Altura proporcional do SVG (160x110) garantindo espaço folgado para o percentual abaixo
  const height = (size * 110) / 160;

  return (
    <div className="speedometer-container" style={{ width: size, textAlign: 'center' }}>
      <svg
        viewBox="0 0 160 110"
        width={size}
        height={height}
        className="speedometer-svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Gradiente sutil do arco ativo */}
          <linearGradient id={`gauge-grad-${pct}`} x1="0%" y1="100%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={pct < 50 ? '#DC3545' : '#FFC107'} />
            <stop offset="100%" stopColor={activeColor} />
          </linearGradient>

          {/* Sombra suave para o ponteiro */}
          <filter id="needle-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="rgba(11, 37, 69, 0.2)" />
          </filter>
        </defs>

        {/* Arco de fundo (trilho cinza claro) */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="rgba(11, 37, 69, 0.08)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Arco preenchido proporcional */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={`url(#gauge-grad-${pct})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />

        {/* Marcadores numéricos de escala (0, 50, 100) posicionados fora da rota do texto */}
        <text x={cx - r - 5} y={cy + 4} fontSize="9" fontWeight="600" fill="#8c9ba5" textAnchor="end">0</text>
        <text x={cx} y={cy - r - 6} fontSize="9" fontWeight="600" fill="#8c9ba5" textAnchor="middle">50</text>
        <text x={cx + r + 5} y={cy + 4} fontSize="9" fontWeight="600" fill="#8c9ba5" textAnchor="start">100</text>

        {/* Ponteiro (agulha) */}
        {showNeedle && (
          <g
            style={{
              transform: `rotate(${needleAngle}deg)`,
              transformOrigin: `${cx}px ${cy}px`,
              transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            filter="url(#needle-shadow)"
          >
            {/* Haste da agulha */}
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - r + 8}
              stroke="#0b2545"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Ponta da agulha com detalhe colorido */}
            <polygon
              points={`${cx - 2},${cy - 18} ${cx + 2},${cy - 18} ${cx},${cy - r + 5}`}
              fill={activeColor}
            />
          </g>
        )}

        {/* Pivô central compacto da agulha */}
        <circle cx={cx} cy={cy} r="5" fill="#0b2545" />
        <circle cx={cx} cy={cy} r="2.2" fill="#ffffff" />

        {/* Valor Percentual Digital com espaço limpo e destaque */}
        <text
          x={cx}
          y={cy + 28}
          fontSize="21"
          fontWeight="800"
          fill="#0b2545"
          textAnchor="middle"
          letterSpacing="-0.02em"
        >
          {pct}%
        </text>
      </svg>

      {label && <span className="speedometer-label">{label}</span>}
    </div>
  );
};

export default SpeedometerGauge;
