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
    <div className={`team-panel ${isActive ? 'active' : ''}`} style={{ 
      width: '200px', 
      minHeight: '200px',
      maxHeight: '300px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h3 className="team-title">{team.name}</h3>
      <div style={{ marginBottom: '1rem', color: 'white', textAlign: 'center' }}>
        Счет: {team.score}
      </div>
      <div style={{ 
        maxHeight: '120px', 
        overflowY: 'auto',
        marginBottom: '1rem',
        flex: '1'
      }}>
        <ul className="player-list" style={{ margin: 0, padding: 0 }}>
          {team.players.map((player, index) => (
            <li 
              key={player.id} 
              className={`player-item ${
                isGameStarted && index === team.currentLeaderIndex && isActive ? 'leader' : ''
              }`}
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '180px'
              }}
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
      {canChangeTeam && onChangeTeam && (
        <div style={{ textAlign: 'center', marginTop: 'auto' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => onChangeTeam(team.id)}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', width: '100%' }}
          >
            Перейти
          </button>
        </div>
      )}
    </div>
  );
};

export default TeamPanel;
