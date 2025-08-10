import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useTheme } from '../contexts/ThemeContext';
import type { UserSettings, Player } from '../types/game';
import { getUserId } from '../utils/userId';
import WheelComponent from '../components/WheelComponent';
import TeamPanel from '../components/TeamPanel';
import GameControls from '../components/GameControls';

const GamePage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [playerName, setPlayerName] = useState(() => {
    // Синхронно читаем сохранённое имя до первого рендера, чтобы избежать мигания формы
    let nameFromSettings = '';
    try {
      const savedSettings = localStorage.getItem('gameSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings) as UserSettings;
        if (parsed.nickname) nameFromSettings = parsed.nickname;
      }
      if (!nameFromSettings) {
        const last = localStorage.getItem('lastPlayerName');
        if (last) nameFromSettings = last;
      }
    } catch (e) {
      console.error('Failed to load saved name', e);
    }
    return nameFromSettings;
  });
  const [isJoined, setIsJoined] = useState(false);
  // Флаг, что мы уже пытались присоединиться (чтобы не слать повторно)
  const [attemptedJoin, setAttemptedJoin] = useState(false); // попытка ещё не совершена, даже если имя сохранено
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const userId = getUserId();
  // Запоминаем, что имя было загружено (а не вводится пользователем заново)
  const hadSavedNameRef = useRef(playerName !== '');

  const {
    gameState,
    error,
    connected,
    joinRoom,
    leaveRoom,
    changeTeam,
    startGame,
    spinWheel,
    setAssociation,
    moveArrow,
    confirmArrow,
    clearError
  } = useSocket();

  useEffect(() => {
    // Автоприсоединяемся только если имя было предзагружено (из сохранённых настроек)
    if (hadSavedNameRef.current && playerName && roomId && connected && !isJoined && !attemptedJoin) {
      setAttemptedJoin(true);
      joinRoom(roomId, playerName.trim());
    }
  }, [connected, roomId, isJoined, attemptedJoin, playerName, joinRoom]);

  // Fallback: если не получили состояние игры за 3 секунды – сбрасываем attemptedJoin для повторной попытки
  useEffect(() => {
    if (attemptedJoin && !isJoined && !error) {
      const timer = setTimeout(() => {
        if (!isJoined) {
          setAttemptedJoin(false);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [attemptedJoin, isJoined, error]);

  useEffect(() => {
    if (gameState) {
      // Предпочитаем поиск по userId (устойчиво к смене имени)
      let found: Player | undefined;
      for (const team of gameState.teams) {
        found = team.players.find(p => p.userId === userId);
        if (found) break;
      }
      // Если не нашли по userId, пробуем по имени (fallback)
      if (!found) {
        for (const team of gameState.teams) {
          const byName = team.players.find(p => p.name === playerName);
          if (byName) { found = byName; break; }
        }
      }
      if (found) {
        setCurrentPlayer(found);
        if (!isJoined) setIsJoined(true);
      }
    }
  }, [gameState, userId, playerName, isJoined]);

  const handleJoinGame = () => {
    if (!roomId || !playerName.trim()) return;
    localStorage.setItem('lastPlayerName', playerName.trim());
    setAttemptedJoin(true);
    joinRoom(roomId, playerName.trim());
  };

  const handleCopyRoomLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleLeaveGame = () => {
    leaveRoom();
    navigate('/');
  };

  const handleChangeTeam = (teamId: number) => {
    changeTeam(teamId);
  };

  const handleStartGame = () => {
    startGame();
  };

  const handleSpinWheel = () => {
    spinWheel();
  };

  const handleSetAssociation = (association: string) => {
    if (!roomId) return;
    setAssociation(roomId, association);
  };

  const handleMoveArrow = (position: number) => {
    if (!roomId) return;
    moveArrow(roomId, position);
  };

  const handleConfirmArrow = () => {
    confirmArrow();
  };

  if (!connected) {
    return (
      <div className="loading">
        Подключение к серверу...
      </div>
    );
  }

  if ((attemptedJoin && !isJoined && !error)) {
    return (
      <div className="loading">
        Входим в игру...
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="settings-page">
        <div className="settings-container">
          <h1 className="settings-title">Присоединиться к игре</h1>
          
          {error && (
            <div className="error-message">
              {error}
              <button onClick={clearError} style={{ marginLeft: '1rem' }}>✕</button>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="playerName" className="form-label">
              Ваше имя
            </label>
            <input
              type="text"
              id="playerName"
              className="form-input"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.slice(0,20))}
              placeholder="Введите ваше имя"
              maxLength={20}
            />
            <div style={{ textAlign: 'right', fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 }}>
              {playerName.length}/20
            </div>
          </div>

          <div className="home-buttons">
            <button 
              className="btn btn-primary" 
              onClick={handleJoinGame}
              disabled={!playerName.trim()}
            >
              Присоединиться
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="loading">
        Загрузка игры...
      </div>
    );
  }

  const currentTeam = gameState.teams.find(t => t.id === gameState.currentTeamId);
  const currentLeader = currentTeam?.players[currentTeam.currentLeaderIndex];
  const isCurrentPlayer = currentPlayer?.id === currentLeader?.id; // текущий пользователь ведущий
  const isInCurrentTeam = currentPlayer && currentTeam ? currentPlayer.teamId === currentTeam.id : false;
  const isCurrentTeamNonLeader = Boolean(isInCurrentTeam && !isCurrentPlayer);
  const isOwner = currentPlayer?.isOwner || false;

  return (
    <div className="game-page">
      {gameState.isGameFinished && gameState.winnerTeamId && (
        <div className="winner-message">
          <div className="winner-content">
            <h1 className="winner-title">🎉 Победа! 🎉</h1>
            <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
              {gameState.teams.find(t => t.id === gameState.winnerTeamId)?.name} выиграла!
            </p>
            {isOwner && (
              <button className="btn btn-primary" onClick={handleStartGame}>
                Начать новую игру
              </button>
            )}
          </div>
        </div>
      )}

      <div className="game-header">
        <div></div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={toggleTheme}
            style={{ fontSize: '0.9rem', minWidth: 'auto', padding: '0.5rem' }}
            title="Сменить тему"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handleCopyRoomLink}
            style={{ fontSize: '0.9rem' }}
          >
            {copySuccess ? '✓ Скопировано!' : '📋 Ссылка'}
          </button>
          <button className="btn btn-secondary" onClick={handleLeaveGame}>
            Покинуть игру
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={clearError} style={{ marginLeft: '1rem' }}>✕</button>
        </div>
      )}

      <div className="game-content">
        <TeamPanel 
          team={gameState.teams[0]} 
          isActive={gameState.currentTeamId === 1}
          isGameStarted={gameState.isGameStarted}
          currentPlayer={currentPlayer}
          onChangeTeam={handleChangeTeam}
        />
        <TeamPanel 
          team={gameState.teams[1]} 
          isActive={gameState.currentTeamId === 2}
          isGameStarted={gameState.isGameStarted}
          currentPlayer={currentPlayer}
          onChangeTeam={handleChangeTeam}
        />

        <div className="wheel-container">
          <WheelComponent
            wheelResult={gameState.wheelResult}
            wheelSectors={gameState.wheelSectors}
            arrowPosition={gameState.arrowPosition}
            canSeeWheel={isCurrentPlayer}
            canControl={isCurrentTeamNonLeader && !!gameState.currentAssociation} // двигать после появления ассоциации
            onMoveArrow={handleMoveArrow}
          />

          <GameControls
            gameState={gameState}
            isOwner={isOwner}
            isCurrentLeader={isCurrentPlayer}
            isCurrentTeamNonLeader={isCurrentTeamNonLeader}
            onStartGame={handleStartGame}
            onSpinWheel={handleSpinWheel}
            onSetAssociation={handleSetAssociation}
            onConfirmArrow={handleConfirmArrow}
          />
        </div>
      </div>
    </div>
  );
};

export default GamePage;
