import { Injectable } from '@nestjs/common';
import { GameState, Player, Team, WheelSector } from './types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GameService {
  private games: Map<string, GameState> = new Map();
  private socketToRoom: Map<string, string> = new Map();

  // Антонимы для игры
  private antonymPairs: [string, string][] = [
    ['Горячий', 'Холодный'],
    ['Быстрый', 'Медленный'],
    ['Большой', 'Маленький'],
    ['Светлый', 'Темный'],
    ['Высокий', 'Низкий'],
    ['Широкий', 'Узкий'],
    ['Длинный', 'Короткий'],
    ['Тяжелый', 'Легкий'],
    ['Сильный', 'Слабый'],
    ['Мягкий', 'Твердый'],
    ['Новый', 'Старый'],
    ['Богатый', 'Бедный'],
    ['Умный', 'Глупый'],
    ['Добрый', 'Злой'],
    ['Веселый', 'Грустный']
  ];

  // Секторы колеса
  private wheelSectors: WheelSector[] = [
    { value: 2, color: 'yellow', startAngle: 0, endAngle: 60 },
    { value: 3, color: 'red', startAngle: 60, endAngle: 120 },
    { value: 4, color: 'blue', startAngle: 120, endAngle: 240 },
    { value: 3, color: 'red', startAngle: 240, endAngle: 300 },
    { value: 2, color: 'yellow', startAngle: 300, endAngle: 360 }
  ];

  createGame(): string {
    const gameId = uuidv4();
    const gameState: GameState = {
      id: gameId,
      teams: [
        { id: 1, name: 'Команда 1', score: 0, players: [], currentLeaderIndex: 0 },
        { id: 2, name: 'Команда 2', score: 0, players: [], currentLeaderIndex: 0 }
      ],
      currentTeamId: 1,
      currentRound: 1,
      isGameStarted: false,
      isGameFinished: false
    };

    this.games.set(gameId, gameState);
    return gameId;
  }

  joinGame(gameId: string, socketId: string, playerName: string, teamId?: number): GameState | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    // Если игра уже началась, игрок может только переподключиться
    if (game.isGameStarted) {
      const existingPlayer = this.findPlayerByName(game, playerName);
      if (existingPlayer) {
        existingPlayer.socketId = socketId;
        this.socketToRoom.set(socketId, gameId);
        return game;
      }
      return null; // Новые игроки не могут присоединиться к начатой игре
    }

    // Определяем команду для игрока
    let assignedTeamId = teamId;
    if (!assignedTeamId) {
      // Автоматически назначаем в команду с меньшим количеством игроков
      assignedTeamId = game.teams[0].players.length <= game.teams[1].players.length ? 1 : 2;
    }

    const isOwner = game.teams.every(team => team.players.length === 0);
    
    const newPlayer: Player = {
      id: uuidv4(),
      name: playerName,
      teamId: assignedTeamId,
      isOwner,
      socketId
    };

    const team = game.teams.find(t => t.id === assignedTeamId);
    if (team) {
      team.players.push(newPlayer);
    }

    this.socketToRoom.set(socketId, gameId);
    return game;
  }

  leaveGame(socketId: string): { gameId: string; game: GameState } | null {
    const gameId = this.socketToRoom.get(socketId);
    if (!gameId) return null;

    const game = this.games.get(gameId);
    if (!game) return null;

    // Удаляем игрока из команды
    for (const team of game.teams) {
      const playerIndex = team.players.findIndex(p => p.socketId === socketId);
      if (playerIndex !== -1) {
        team.players.splice(playerIndex, 1);
        break;
      }
    }

    this.socketToRoom.delete(socketId);

    // Если в комнате не осталось игроков, удаляем игру
    const totalPlayers = game.teams.reduce((sum, team) => sum + team.players.length, 0);
    if (totalPlayers === 0) {
      this.games.delete(gameId);
      return null;
    }

    return { gameId, game };
  }

  startGame(gameId: string, socketId: string): GameState | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    // Проверяем, что игрок является владельцем комнаты
    const player = this.findPlayerBySocketId(game, socketId);
    if (!player || !player.isOwner) return null;

    // Проверяем, что в каждой команде есть хотя бы один игрок
    if (game.teams.some(team => team.players.length === 0)) return null;

    game.isGameStarted = true;
    this.startNewRound(game);

    return game;
  }

  spinWheel(gameId: string, socketId: string): GameState | null {
    const game = this.games.get(gameId);
    if (!game || !game.isGameStarted) return null;

    // Проверяем, что игрок является ведущим текущей команды
    const currentTeam = game.teams.find(t => t.id === game.currentTeamId);
    if (!currentTeam) return null;

    const currentLeader = currentTeam.players[currentTeam.currentLeaderIndex];
    if (!currentLeader || currentLeader.socketId !== socketId) return null;

    // Генерируем случайный результат колеса (угол от 0 до 360)
    const wheelAngle = Math.random() * 360;
    game.wheelResult = wheelAngle;

    // Выбираем случайную пару антонимов
    const randomPair = this.antonymPairs[Math.floor(Math.random() * this.antonymPairs.length)];
    game.currentAntonyms = randomPair;

    return game;
  }

  setAssociation(gameId: string, socketId: string, association: string): GameState | null {
    const game = this.games.get(gameId);
    if (!game || !game.isGameStarted) return null;

    // Проверяем, что игрок является ведущим текущей команды
    const currentTeam = game.teams.find(t => t.id === game.currentTeamId);
    if (!currentTeam) return null;

    const currentLeader = currentTeam.players[currentTeam.currentLeaderIndex];
    if (!currentLeader || currentLeader.socketId !== socketId) return null;

    game.currentAssociation = association;
    return game;
  }

  moveArrow(gameId: string, socketId: string, position: number): GameState | null {
    const game = this.games.get(gameId);
    if (!game || !game.isGameStarted) return null;

    // Проверяем, что игрок не является ведущим (ведущий не может двигать стрелку)
    const currentTeam = game.teams.find(t => t.id === game.currentTeamId);
    if (!currentTeam) return null;

    const currentLeader = currentTeam.players[currentTeam.currentLeaderIndex];
    if (currentLeader && currentLeader.socketId === socketId) return null;

    game.arrowPosition = position;
    return game;
  }

  confirmArrow(gameId: string): GameState | null {
    const game = this.games.get(gameId);
    if (!game || !game.isGameStarted || game.arrowPosition === undefined) return null;

    // Вычисляем очки на основе позиции стрелки
    const points = this.calculatePoints(game.arrowPosition);
    
    // Добавляем очки текущей команде
    const currentTeam = game.teams.find(t => t.id === game.currentTeamId);
    if (currentTeam) {
      currentTeam.score += points;

      // Проверяем условие победы
      if (currentTeam.score >= 20) {
        game.isGameFinished = true;
        game.winnerTeamId = currentTeam.id;
        return game;
      }
    }

    // Переходим к следующему ходу
    this.nextTurn(game);
    return game;
  }

  getGame(gameId: string): GameState | null {
    return this.games.get(gameId) || null;
  }

  getGameBySocketId(socketId: string): GameState | null {
    const gameId = this.socketToRoom.get(socketId);
    if (!gameId) return null;
    return this.games.get(gameId) || null;
  }

  private findPlayerBySocketId(game: GameState, socketId: string): Player | null {
    for (const team of game.teams) {
      const player = team.players.find(p => p.socketId === socketId);
      if (player) return player;
    }
    return null;
  }

  private findPlayerByName(game: GameState, name: string): Player | null {
    for (const team of game.teams) {
      const player = team.players.find(p => p.name === name);
      if (player) return player;
    }
    return null;
  }

  private startNewRound(game: GameState): void {
    // Сбрасываем состояние раунда
    game.wheelResult = undefined;
    game.currentAntonyms = undefined;
    game.currentAssociation = undefined;
    game.arrowPosition = undefined;
  }

  private nextTurn(game: GameState): void {
    const currentTeam = game.teams.find(t => t.id === game.currentTeamId);
    if (currentTeam) {
      // Меняем ведущего в текущей команде
      currentTeam.currentLeaderIndex = (currentTeam.currentLeaderIndex + 1) % currentTeam.players.length;
    }

    // Переключаем команду
    game.currentTeamId = game.currentTeamId === 1 ? 2 : 1;
    
    // Начинаем новый раунд
    this.startNewRound(game);
    game.currentRound++;
  }

  private calculatePoints(arrowPosition: number): number {
    // Нормализуем позицию стрелки к углу от 0 до 360
    const angle = (arrowPosition % 360 + 360) % 360;
    
    // Находим сектор, в который попала стрелка
    for (const sector of this.wheelSectors) {
      if (angle >= sector.startAngle && angle < sector.endAngle) {
        return sector.value;
      }
    }
    
    return 0; // Если стрелка не попала ни в один сектор
  }
}
