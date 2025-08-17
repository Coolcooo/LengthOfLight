import { useAudioManager } from '../hooks/useAudioManager';
import { useEffect, useState } from 'react';
import type { AudioTrack } from '../hooks/useAudioManager';
import './AudioControls.css';

interface AudioControlsProps {
  currentPage?: 'home' | 'game' | 'lobby';
  className?: string;
}

const AudioControls = ({ 
  currentPage = 'home', 
  className = ''
}: AudioControlsProps) => {
  const audio = useAudioManager();
  const [showAutoplayHint, setShowAutoplayHint] = useState(false);

  // Автоматическая смена музыки в зависимости от страницы
  const getTrackForPage = (page: string): AudioTrack => {
    switch (page) {
      case 'game':
        return 'game';
      case 'lobby':
        return 'menu';
      default:
        return 'background';
    }
  };

  // Автоматически начинаем воспроизведение при монтировании компонента
  useEffect(() => {
    const track = getTrackForPage(currentPage);
    
    // Пытаемся начать воспроизведение
    const startPlayback = () => {
      if (!audio.isPlaying) {
        audio.play(track);
        
        // Показываем подсказку, если автовоспроизведение не началось
        setTimeout(() => {
          if (!audio.isPlaying) {
            setShowAutoplayHint(true);
            setTimeout(() => setShowAutoplayHint(false), 5000);
          }
        }, 1000);
      }
    };

    // Небольшая задержка для лучшей совместимости
    const timer = setTimeout(startPlayback, 100);

    return () => clearTimeout(timer);
  }, [currentPage, audio]);

  const handlePlayPause = () => {
    setShowAutoplayHint(false); // Скрываем подсказку при ручном действии
    if (audio.isPlaying) {
      audio.pause();
    } else {
      const track = getTrackForPage(currentPage);
      audio.play(track);
    }
  };

  return (
    <div className={`audio-controls ${className}`}>
      {/* Подсказка об автовоспроизведении */}
      {showAutoplayHint && (
        <div className="autoplay-hint">
          Нажмите кнопку воспроизведения для включения музыки
        </div>
      )}
      
      {/* Кнопка воспроизведения/паузы */}
      <button 
        className={`audio-btn play-pause-btn ${audio.isPlaying ? 'playing' : 'paused'}`}
        onClick={handlePlayPause}
        title={audio.isPlaying ? 'Пауза' : 'Воспроизвести'}
      >
        {audio.isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>

      {/* Кнопка отключения звука */}
      <button 
        className={`audio-btn mute-btn ${audio.isMuted ? 'muted' : ''}`}
        onClick={audio.toggleMute}
        title={audio.isMuted ? 'Включить звук' : 'Отключить звук'}
      >
        {audio.isMuted ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        )}
      </button>
    </div>
  );
};

export default AudioControls;
