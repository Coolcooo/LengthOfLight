import type { Team } from '../types/game';

interface TeamPanelProps {
  team: Team;
  isActive: boolean;
  isGameStarted: boolean;
}

const TeamPanel = ({ team, isActive, isGameStarted }: TeamPanelProps) => {
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
    </div>
  );
};

export default TeamPanel;
