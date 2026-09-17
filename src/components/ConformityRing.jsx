import React from 'react';
import './ConformityRing.css';

const ConformityRing = ({ value = 0, size = 100, strokeWidth = 8, label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const getColor = (pct) => {
    if (pct >= 80) return 'var(--status-ok)';
    if (pct >= 50) return 'var(--status-alert)';
    return 'var(--status-critical)';
  };

  const color = getColor(value);

  return (
    <div className="conformity-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="conformity-ring__svg">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="conformity-ring__progress"
        />
      </svg>
      <div className="conformity-ring__content">
        <span className="conformity-ring__value" style={{ color }}>
          {value}%
        </span>
        {label && <span className="conformity-ring__label">{label}</span>}
      </div>
    </div>
  );
};

export default ConformityRing;
