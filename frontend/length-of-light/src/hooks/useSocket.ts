import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getUserId } from '../utils/userId';
import type { GameState } from '../types/game';

// Константы событий
const GameEvents = {
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  CHANGE_TEAM: 'change_team',
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

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setError('Ошибка подключения к серверу');
      setConnected(false);
    });

    newSocket.on(GameEvents.GAME_UPDATE, (game: GameState) => {
      console.log('Game updated:', game);
      setGameState(game);
    });

    newSocket.on(GameEvents.ERROR, (errorData: { message: string }) => {
      console.error('Game error:', errorData.message);
      setError(errorData.message);
    });

    newSocket.on(GameEvents.PLAYER_JOINED, (data: any) => {
      console.log('Player joined:', data);
    });

    newSocket.on(GameEvents.PLAYER_LEFT, (data: any) => {
      console.log('Player left:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinRoom = (roomId: string, playerName: string) => {
    if (socket) {
      const userId = getUserId(); // Получаем уникальный ID пользователя
      socket.emit(GameEvents.JOIN_ROOM, { roomId, playerName, userId });
    }
  };

  const leaveRoom = () => {
    if (socket) {
      socket.emit(GameEvents.LEAVE_ROOM);
    }
  };

  const changeTeam = (newTeam: number) => {
    if (socket) {
      socket.emit(GameEvents.CHANGE_TEAM, { team: newTeam });
    }
  };

  const startGame = () => {
    if (socket) {
      socket.emit(GameEvents.START_GAME);
    }
  };

  const spinWheel = () => {
    if (socket) {
      socket.emit(GameEvents.SPIN_WHEEL);
    }
  };

  const setAssociation = (roomId: string, association: string) => {
    if (socket) {
      socket.emit(GameEvents.SET_ASSOCIATION, { roomId, association });
    }
  };

  const moveArrow = (roomId: string, position: number) => {
    if (socket) {
      socket.emit(GameEvents.MOVE_ARROW, { roomId, position });
    }
  };

  const confirmArrow = () => {
    if (socket) {
      socket.emit(GameEvents.CONFIRM_ARROW);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    socket,
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
  };
};
