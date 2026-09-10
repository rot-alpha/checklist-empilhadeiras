import React, { useEffect } from 'react';
import InspectionCalendar from './InspectionCalendar';
import './CalendarModal.css';

const CalendarModal = ({ isOpen, onClose, data }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="calendar-modal-backdrop" onClick={onClose}>
      <div 
        className="calendar-modal-content" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="calendar-modal-header">
          <div className="modal-title-box">
            <span className="modal-pill-tag">Auditoria & Registros</span>
            <h2 className="modal-title">Calendário de Inspeções & Lançamentos</h2>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            title="Fechar (ESC)"
          >
            ✕ Fechar
          </button>
        </div>

        <div className="calendar-modal-body">
          <InspectionCalendar data={data} />
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
