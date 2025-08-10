import type { Team, Player } from '../types/game';

interface TeamPanelProps {
  team: Team;
  isActive: boolean;
  isGameStarted: boolean;
  currentPlayer?: Player | null;
  onChangeTeam?: (teamId: number) => void;
}

const TeamPanel = ({ team, isActive, isGameStarted, currentPlayer, onChangeTeam }: TeamPanelProps) => {
  const canChangeTeam = !isGameStarted && currentPlayer && currentPlayer.teamId !== team.id;

  return (
    <div className={`team-panel ${isActive ? 'active' : ''}`}>
      <h3 className="team-title">{team.name}</h3>
      <div style={{ marginBottom: '1rem', color: 'white', textAlign: 'center' }}>
        Счет: {team.score}
      </div>
      <ul className="player-list">
        {team.players.map((player, index) => (
          <li 
            key={player.id} 
            className={`player-item ${
              isGameStarted && index === team.currentLeaderIndex ? 'leader' : ''
            }`}
          >
            {player.name}
            {player.isOwner && ' 👑'}
            {isGameStarted && index === team.currentLeaderIndex && ' (Ведущий)'}
          </li>
        ))}
        {team.players.length === 0 && (
          <li className="player-item" style={{ opacity: 0.6 }}>
            Нет игроков
          </li>
        )}
      </ul>
      {canChangeTeam && onChangeTeam && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => onChangeTeam(team.id)}
            style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
          >
            Перейти в команду
          </button>
        </div>
      )}
    </div>
  );
};

export default TeamPanel;
