import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserSettings } from '../types/game';

const SettingsPage = () => {
  const navigate = useNavigate();
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
