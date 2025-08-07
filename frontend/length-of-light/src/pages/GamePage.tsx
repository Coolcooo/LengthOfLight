import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import type { UserSettings, Player } from '../types/game';
import WheelComponent from '../components/WheelComponent';
import TeamPanel from '../components/TeamPanel';
import GameControls from '../components/GameControls';

const GamePage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<number>(1);
  const [isJoined, setIsJoined] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  const {
    gameState,
    error,
    connected,
    joinRoom,
    leaveRoom,
    startGame,
    spinWheel,
    setAssociation,
    moveArrow,
    confirmArrow,
    clearError
  } = useSocket();

  useEffect(() => {
    // Загружаем никнейм из настроек
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings) as UserSettings;
        if (parsed.nickname) {
          setPlayerName(parsed.nickname);
        }
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Находим текущего игрока в игре
    if (gameState) {
      for (const team of gameState.teams) {
        const player = team.players.find(p => p.name === playerName);
        if (player) {
          setCurrentPlayer(player);
          break;
        }
      }
    }
  }, [gameState, playerName]);

  const handleJoinGame = () => {
    if (!roomId || !playerName.trim()) return;
    
    joinRoom(roomId, playerName.trim(), selectedTeam);
    setIsJoined(true);
  };

  const handleLeaveGame = () => {
    leaveRoom();
    navigate('/');
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

          <div className="room-info">
            <div className="room-id">Комната: {roomId}</div>
            <div className="room-link">
              {window.location.href}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="playerName" className="form-label">
              Ваше имя
            </label>
            <input
              type="text"
              id="playerName"
              className="form-input"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Введите ваше имя"
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Выберите команду</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <label className="checkbox-group">
                <input
                  type="radio"
                  name="team"
                  value={1}
                  checked={selectedTeam === 1}
                  onChange={() => setSelectedTeam(1)}
                />
                Команда 1
              </label>
              <label className="checkbox-group">
                <input
                  type="radio"
                  name="team"
                  value={2}
                  checked={selectedTeam === 2}
                  onChange={() => setSelectedTeam(2)}
                />
                Команда 2
              </label>
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
  const isCurrentPlayer = currentPlayer?.id === currentLeader?.id;
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
        <div className="game-score">
          <div>Команда 1: {gameState.teams[0]?.score || 0}</div>
          <div>Команда 2: {gameState.teams[1]?.score || 0}</div>
        </div>
        <div>
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
        />
        <TeamPanel 
          team={gameState.teams[1]} 
          isActive={gameState.currentTeamId === 2}
          isGameStarted={gameState.isGameStarted}
        />

        <div className="wheel-container">
          <WheelComponent
            wheelResult={gameState.wheelResult}
            arrowPosition={gameState.arrowPosition}
            isLeader={isCurrentPlayer}
            canSeeWheel={isCurrentPlayer}
            onMoveArrow={handleMoveArrow}
          />

          <GameControls
            gameState={gameState}
            isOwner={isOwner}
            isCurrentLeader={isCurrentPlayer}
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
