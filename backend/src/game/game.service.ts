import { Injectable } from '@nestjs/common';
import { GameState, Player, Team, WheelSector } from './types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GameService {
  private games: Map<string, GameState> = new Map();
  private socketToRoom: Map<string, string> = new Map();
  private gameWheelSectors: Map<string, WheelSector[]> = new Map(); // Секторы для каждой игры

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

  // Секторы колеса (будут генерироваться случайно)
  private generateRandomWheelSectors(): WheelSector[] {
    // Общий размер всех секторов (например, 120° из 180° полукруга)
    const totalSectorSize = 120;
    const sectorSizes = [20, 25, 35, 25, 15]; // Размеры секторов в градусах
    const sectorValues = [2, 3, 4, 3, 2]; // Соответствующие очки
    const sectorColors: Array<'yellow' | 'red' | 'blue'> = ['yellow', 'red', 'blue', 'red', 'yellow'];
    
    // Случайная начальная позиция (от 0 до 60°, чтобы секторы поместились)
    const startOffset = Math.random() * (180 - totalSectorSize);
    
    const sectors: WheelSector[] = [];
    let currentAngle = startOffset;
    
    for (let i = 0; i < sectorSizes.length; i++) {
      sectors.push({
        value: sectorValues[i],
        color: sectorColors[i],
        startAngle: currentAngle,
        endAngle: currentAngle + sectorSizes[i]
      });
      currentAngle += sectorSizes[i];
    }
    
    return sectors;
  }

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
  turnsSinceLeaderRotation: 0,
      isGameStarted: false,
      isGameFinished: false
    };

    this.games.set(gameId, gameState);
    return gameId;
  }

  joinGame(gameId: string, socketId: string, playerName: string, userId: string): GameState | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    // Проверяем, есть ли уже игрок с таким userId (переподключение)
    const existingPlayer = this.findPlayerByUserId(game, userId);
    if (existingPlayer) {
      // Игрок переподключается - обновляем только socketId
      existingPlayer.socketId = socketId;
      existingPlayer.name = playerName; // Обновляем имя на случай изменения
      this.socketToRoom.set(socketId, gameId);
      return game;
    }

    // Если игра уже началась и это новый игрок, не разрешаем присоединение
    if (game.isGameStarted) {
      return null;
    }

    // Определяем команду для игрока - всегда выбираем команду с меньшим количеством игроков
    const assignedTeamId = game.teams[0].players.length <= game.teams[1].players.length ? 1 : 2;

    const isOwner = game.teams.every(team => team.players.length === 0);
    
    const newPlayer: Player = {
      id: uuidv4(),
      userId,
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
      this.gameWheelSectors.delete(gameId);
      return null;
    }

    return { gameId, game };
  }

  changePlayerTeam(socketId: string, newTeamId: number): { gameId: string; game: GameState } | null {
    const gameId = this.socketToRoom.get(socketId);
    if (!gameId) return null;

    const game = this.games.get(gameId);
    if (!game || game.isGameStarted) return null; // Нельзя менять команду после начала игры

    // Находим игрока
    let playerToMove: Player | null = null;
    let oldTeamId: number | null = null;

    for (const team of game.teams) {
      const playerIndex = team.players.findIndex(p => p.socketId === socketId);
      if (playerIndex !== -1) {
        playerToMove = team.players[playerIndex];
        oldTeamId = team.id;
        team.players.splice(playerIndex, 1);
        break;
      }
    }

    if (!playerToMove || oldTeamId === newTeamId) return null;

    // Перемещаем игрока в новую команду
    const newTeam = game.teams.find(t => t.id === newTeamId);
    if (newTeam) {
      playerToMove.teamId = newTeamId;
      newTeam.players.push(playerToMove);
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

    // Генерируем новые случайные позиции секторов
    const newSectors = this.generateRandomWheelSectors();
    this.gameWheelSectors.set(gameId, newSectors);
    game.wheelSectors = newSectors;

    // Генерируем случайный результат колеса (угол от 0 до 180)
    const wheelAngle = Math.random() * 180;
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

    // Проверяем, что игрок принадлежит текущей команде и не является её ведущим
    const currentTeam = game.teams.find(t => t.id === game.currentTeamId);
    if (!currentTeam) return null;
    const player = currentTeam.players.find(p => p.socketId === socketId);
    if (!player) return null; // игрок из другой команды не может двигать стрелку
    const currentLeader = currentTeam.players[currentTeam.currentLeaderIndex];
    if (currentLeader && currentLeader.socketId === socketId) return null; // ведущий не двигает стрелку

    game.arrowPosition = position;
    return game;
  }

  confirmArrow(gameId: string, socketId: string): GameState | null {
    const game = this.games.get(gameId);
    if (!game || !game.isGameStarted || game.arrowPosition === undefined) return null;

    // Подтвердить может только НЕ ведущий игрок текущей команды
    const currentTeam = game.teams.find(t => t.id === game.currentTeamId);
    if (!currentTeam) return null;
    const player = currentTeam.players.find(p => p.socketId === socketId);
    if (!player) return null; // другой команды
    const currentLeader = currentTeam.players[currentTeam.currentLeaderIndex];
    if (currentLeader && currentLeader.socketId === socketId) return null; // ведущий не подтверждает

    // Вычисляем очки на основе позиции стрелки
    const points = this.calculatePoints(game.arrowPosition, gameId);
    
    // Добавляем очки текущей команде
    currentTeam.score += points;

    // Проверяем условие победы
    if (currentTeam.score >= 5) {
      game.isGameFinished = true;
      game.winnerTeamId = currentTeam.id;
      return game;
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

  private findPlayerByUserId(game: GameState, userId: string): Player | null {
    for (const team of game.teams) {
      const player = team.players.find(p => p.userId === userId);
      if (player) return player;
    }
    return null;
  }

  private startNewRound(game: GameState): void {
    // Сбрасываем состояние раунда
    game.wheelResult = undefined;
    game.wheelSectors = undefined;
    game.currentAntonyms = undefined;
    game.currentAssociation = undefined;
    game.arrowPosition = undefined;
  }

  private nextTurn(game: GameState): void {
    // Увеличиваем счётчик завершённых ходов (один ход = одна сыгранная ассоциация одной команды)
    game.turnsSinceLeaderRotation += 1;

    // Переключаем активную команду (ход переходит другой команде)
    game.currentTeamId = game.currentTeamId === 1 ? 2 : 1;

    // Если обе команды сходили (2 хода), меняем ведущих в обеих командах
    if (game.turnsSinceLeaderRotation >= 2) {
      for (const team of game.teams) {
        if (team.players.length > 0) {
          team.currentLeaderIndex = (team.currentLeaderIndex + 1) % team.players.length;
        }
      }
      game.turnsSinceLeaderRotation = 0; // Сбрасываем счётчик
    }

    // Сбрасываем состояние раунда и увеличиваем номер раунда
    this.startNewRound(game);
    game.currentRound++;
  }

  private calculatePoints(arrowPosition: number, gameId: string): number {
    // Нормализуем позицию стрелки к углу от 0 до 180 (полукруг)
    let angle = arrowPosition % 180;
    if (angle < 0) angle += 180;
    
    // Получаем секторы для данной игры
    const sectors = this.gameWheelSectors.get(gameId);
    if (!sectors) return 0;
    
    // Находим сектор, в который попала стрелка
    for (const sector of sectors) {
      if (angle >= sector.startAngle && angle < sector.endAngle) {
        return sector.value;
      }
    }
    
    return 0; // Если стрелка не попала ни в один сектор
  }
}
