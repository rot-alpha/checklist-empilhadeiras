import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Papa from 'papaparse';
import './ForkliftDetail.css';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRuiTWVDNhAVtbah-F5-1ReFHH57pkhlM1mtrQOOh6nUNXB2wof8AMjaP_Mnjk6K5hU4rzs6OvhAZit/pub?output=csv';

const ForkliftDetail = () => {
  const { modelo } = useParams();
  const decodedModelo = decodeURIComponent(modelo);
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      complete: (results) => {
        // Filtra apenas a empilhadeira específica e inverte a ordem (mais recentes primeiro)
        const data = results.data
          .filter(row => row.Modelo === decodedModelo)
          .reverse(); 

        setHistory(data);
        setLoading(false);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        setLoading(false);
      }
    });
  }, [decodedModelo]);

  return (
    <div className="detail-container">
      <header className="detail-header">
        <Link to="/" className="back-link">← Voltar para Dashboard</Link>
        <h1>Histórico: {decodedModelo}</h1>
      </header>

      <main className="detail-main">
        {loading ? (
          <p>Carregando histórico...</p>
        ) : history.length === 0 ? (
          <p>Nenhuma inspeção encontrada para esta empilhadeira.</p>
        ) : (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Operador</th>
                  <th>Turno</th>
                  <th>Horímetro</th>
                  <th>Status Rápido</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row, index) => {
                  // Lógica rápida para determinar se teve Não Conforme nesta inspeção específica
                  const hasProblem = Object.values(row).includes('Não Conforme');
                  return (
                    <tr key={index} className={hasProblem ? 'row-problem' : 'row-ok'}>
                      <td>{row['Carimbo de data/hora']}</td>
                      <td>{row['Nome do Operador']}</td>
                      <td>{row['Turno (Manhã / Tarde)']}</td>
                      <td>{row['Leitura do Horímetro Inicial']}</td>
                      <td>
                        <span className={`badge ${hasProblem ? 'badge-alert' : 'badge-ok'}`}>
                          {hasProblem ? 'Com Falhas' : 'Tudo OK'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default ForkliftDetail;
