import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import type { UserSettings } from '../types/game';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings>({
    nickname: '',
    soundEnabled: true,
  });

  useEffect(() => {
    // Загружаем настройки из localStorage
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings) as UserSettings;
        setSettings(parsed);
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
  }, []);

  const handleSave = () => {
    // Сохраняем настройки в localStorage
    localStorage.setItem('gameSettings', JSON.stringify(settings));
    navigate('/');
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      nickname: e.target.value,
    }));
  };

  const handleSoundToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      soundEnabled: e.target.checked,
    }));
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">Настройки</h1>
        
        <div className="form-group">
          <label htmlFor="nickname" className="form-label">
            Никнейм
          </label>
          <input
            type="text"
            id="nickname"
            className="form-input"
            value={settings.nickname}
            onChange={handleNicknameChange}
            placeholder="Введите ваш никнейм"
            maxLength={20}
          />
          <div style={{ textAlign: 'right', fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 }}>
            {settings.nickname.length}/20
          </div>
        </div>

        <div className="form-group">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="sound"
              className="checkbox-input"
              checked={settings.soundEnabled}
              onChange={handleSoundToggle}
            />
            <label htmlFor="sound" className="form-label">
              Включить звук
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Тема оформления</label>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', justifyContent: 'center' }}>
            <label className="checkbox-group">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={() => theme !== 'dark' && toggleTheme()}
              />
              🌙 Темная
            </label>
            <label className="checkbox-group">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === 'light'}
                onChange={() => theme !== 'light' && toggleTheme()}
              />
              ☀️ Светлая
            </label>
          </div>
        </div>

        <div className="home-buttons">
          <button className="btn btn-primary" onClick={handleSave}>
            Назад
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
