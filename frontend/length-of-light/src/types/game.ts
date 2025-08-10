// Типы игры - синхронизированы с бэкендом
export interface Player {
  id: string;
  userId: string; // Уникальный идентификатор пользователя
  name: string;
  teamId: number;
  isOwner: boolean;
  socketId: string;
}

export interface Team {
  id: number;
  name: string;
  score: number;
  players: Player[];
  currentLeaderIndex: number;
}

export interface GameState {
  id: string;
  teams: Team[];
  currentTeamId: number;
  currentRound: number;
  turnsSinceLeaderRotation: number;
  isGameStarted: boolean;
  isGameFinished: boolean;
  wheelResult?: number;
  wheelSectors?: WheelSector[];
  currentAntonyms?: [string, string];
  currentAssociation?: string;
  arrowPosition?: number;
  winnerTeamId?: number;
}

export interface WheelSector {
  value: number;
  color: 'blue' | 'red' | 'yellow';
  startAngle: number;
  endAngle: number;
}

export const GameEvents = {
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  START_GAME: 'start_game',
  SPIN_WHEEL: 'spin_wheel',
  SET_ASSOCIATION: 'set_association',
  MOVE_ARROW: 'move_arrow',
  CONFIRM_ARROW: 'confirm_arrow',
  GAME_UPDATE: 'game_update',
  ERROR: 'error',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left'
} as const;

export interface JoinRoomData {
  roomId: string;
  playerName: string;
  userId: string;
  teamId?: number;
}

export interface MoveArrowData {
  roomId: string;
  position: number;
}

export interface SetAssociationData {
  roomId: string;
  association: string;
}

// Настройки пользователя
export interface UserSettings {
  nickname: string;
  soundEnabled: boolean;
}
