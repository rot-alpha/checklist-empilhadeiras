import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ExportModal from './components/ExportModal';
import Home from './pages/Home';
import ForkliftDetail from './pages/ForkliftDetail';
import { fetchCSVData, getFleetModels } from './data/csvParser';
import './global.css';

function App() {
  const [machines, setMachines] = useState([]);
  const [fullData, setFullData] = useState([]);
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    fetchCSVData().then(data => {
      setFullData(data);
      const fleet = getFleetModels(data);
      setMachines(fleet.map(f => f.Modelo));
    });
  }, []);

  return (
    <ThemeProvider>
      <div className="App">
        <Navbar
          machines={machines}
          onExportClick={() => setIsExportOpen(true)}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/empilhadeira/:modelo" element={<ForkliftDetail />} />
        </Routes>
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          fullData={fullData}
          machines={machines}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
