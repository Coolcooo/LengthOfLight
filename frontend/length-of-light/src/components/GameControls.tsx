import { useState } from 'react';
import type { GameState } from '../types/game';

interface GameControlsProps {
  gameState: GameState;
  isOwner: boolean;
  isCurrentLeader: boolean; // текущий пользователь ведущий активной команды
  isCurrentTeamNonLeader: boolean; // пользователь в активной команде, но не ведущий
  onStartGame: () => void;
  onSpinWheel: () => void;
  onSetAssociation: (association: string) => void;
  onConfirmArrow: () => void;
}

const GameControls = ({
  gameState,
  isOwner,
  isCurrentLeader,
  isCurrentTeamNonLeader,
  onStartGame,
  onSpinWheel,
  onSetAssociation,
  onConfirmArrow
}: GameControlsProps) => {
  const [associationInput, setAssociationInput] = useState('');

  const handleSetAssociation = () => {
    if (associationInput.trim()) {
      onSetAssociation(associationInput.trim());
      setAssociationInput('');
    }
  };

  // Если игра не началась
  if (!gameState.isGameStarted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        {isOwner && (
          <button className="btn btn-primary" onClick={onStartGame}>
            Начать игру
          </button>
        )}

        {!isOwner && (
          <div style={{ color: 'white', textAlign: 'center', opacity: 0.8 }}>
            Ожидание начала игры...
          </div>
        )}
      </div>
    );
  }

  // Если игра закончена
  if (gameState.isGameFinished) {
    return null; // Контролы скрыты, показывается модальное окно победы
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
      {/* Отображение антонимов */}
      {gameState.currentAntonyms && (
        <div className="antonyms-display">
          <span>{gameState.currentAntonyms[0]}</span>
          <span>←→</span>
          <span>{gameState.currentAntonyms[1]}</span>
        </div>
      )}

      {/* Контролы ведущего */}
      {isCurrentLeader && (
        <>
          {/* Кнопка крутить колесо */}
          {!gameState.wheelResult && (
            <button className="btn btn-primary" onClick={onSpinWheel}>
              Крутить колесо
            </button>
          )}

          {/* Поле ввода ассоциации */}
          {gameState.wheelResult && !gameState.currentAssociation && (
            <div className="association-input">
              <input
                type="text"
                className="form-input"
                value={associationInput}
                onChange={(e) => setAssociationInput(e.target.value)}
                placeholder="Введите ассоциацию"
                maxLength={50}
                style={{ flex: 1 }}
              />
              <button 
                className="btn btn-primary" 
                onClick={handleSetAssociation}
                disabled={!associationInput.trim()}
              >
                Принять
              </button>
            </div>
          )}
        </>
      )}

      {/* Отображение ассоциации для всех игроков */}
      {gameState.currentAssociation && (
        <div className="association-display">
          Ассоциация: "{gameState.currentAssociation}"
        </div>
      )}

      {/* Кнопка подтверждения стрелки */}
      {gameState.currentAssociation && gameState.arrowPosition !== undefined && isCurrentTeamNonLeader && (
        <button className="btn btn-primary" onClick={onConfirmArrow}>
          Принять позицию стрелки
        </button>
      )}

      {/* Инструкции для игроков */}
      {gameState.isGameStarted && !gameState.isGameFinished && (
        <div style={{ color: 'white', textAlign: 'center', opacity: 0.8, fontSize: '0.9rem' }}>
          {isCurrentLeader ? (
            <>
              {!gameState.wheelResult && 'Крутите колесо для начала хода'}
              {gameState.wheelResult && !gameState.currentAssociation && 'Введите ассоциацию'}
              {gameState.currentAssociation && 'Ожидание хода команды'}
            </>
          ) : (
            <>
              {!gameState.currentAssociation && 'Ведущий готовит ход...'}
              {gameState.currentAssociation && 'Переместите стрелку и подтвердите позицию'}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GameControls;
