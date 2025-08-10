import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const HomePage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateGame = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('http://localhost:3001/game/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        navigate(`/game/${data.gameId}`);
      } else {
        console.error('Failed to create game');
      }
    } catch (error) {
      console.error('Error creating game:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="home-page">
      <div style={{ position: 'absolute', top: '2rem', right: '2rem' }}>
        <button 
          className="btn btn-secondary" 
          onClick={toggleTheme}
          style={{ minWidth: 'auto', padding: '0.8rem' }}
          title="Сменить тему"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
      
      <h1 className="home-title">Длина волны</h1>
      <div className="home-buttons">
        <button 
          className="btn btn-primary" 
          onClick={handleCreateGame}
          disabled={isCreating}
        >
          {isCreating ? 'Создаём игру...' : 'Создать игру'}
        </button>
        <button className="btn btn-secondary" onClick={handleSettings}>
          Настройки
        </button>
      </div>
    </div>
  );
};

export default HomePage;
