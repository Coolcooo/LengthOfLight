
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAudioManager } from './hooks/useAudioManager';
import { useEffect } from 'react';
import AudioControls from './components/AudioControls';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import GamePage from './pages/GamePage';
import './App.css';

function AppContent() {
  const location = useLocation();
  const audio = useAudioManager();
  
  // Определяем текущую страницу для аудио контролов
  const getCurrentPage = () => {
    if (location.pathname.startsWith('/game/')) return 'game';
    if (location.pathname === '/settings') return 'lobby';
    return 'home';
  };

  // Автоматическое воспроизведение музыки при загрузке
  useEffect(() => {
    const startMusic = () => {
      const currentPage = getCurrentPage();
      const track = currentPage === 'game' ? 'game' : 
                   currentPage === 'lobby' ? 'menu' : 'background';
      audio.play(track);
    };

    // Пытаемся начать воспроизведение сразу
    startMusic();

    // Если браузер блокирует автовоспроизведение, начнем при первом клике
    const handleFirstInteraction = () => {
      startMusic();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // Автоматическое переключение музыки при смене страниц
  useEffect(() => {
    const currentPage = getCurrentPage();
    const track = currentPage === 'game' ? 'game' : 
                 currentPage === 'lobby' ? 'menu' : 'background';
    
    // Переключаем музыку только если аудио уже играет
    if (audio.isPlaying) {
      audio.play(track);
    }
  }, [location.pathname, audio]);

  return (
    <div className="app">
      {/* Аудио контролы в правом верхнем углу */}
      <div className="audio-controls-container">
        <AudioControls 
          currentPage={getCurrentPage()}
          className="global-audio-controls"
        />
      </div>
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/game/:roomId" element={<GamePage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
