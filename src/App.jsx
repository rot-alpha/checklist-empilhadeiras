import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ForkliftDetail from './pages/ForkliftDetail';
import './global.css';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/empilhadeira/:modelo" element={<ForkliftDetail />} />
      </Routes>
    </div>
  );
}

export default App;
