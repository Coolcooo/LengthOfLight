import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import {
  GameEvents,
  JoinRoomData,
  MoveArrowData,
  SetAssociationData,
} from './types';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private gameService: GameService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const result = this.gameService.leaveGame(client.id);
    if (result) {
      // Уведомляем других игроков об уходе
      client.to(result.gameId).emit(GameEvents.GAME_UPDATE, result.game);
      client.to(result.gameId).emit(GameEvents.PLAYER_LEFT, {
        socketId: client.id,
      });
    }
  }

  @SubscribeMessage(GameEvents.JOIN_ROOM)
  handleJoinRoom(
    @MessageBody() data: JoinRoomData,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const game = this.gameService.joinGame(
        data.roomId,
        client.id,
        data.playerName,
        data.teamId,
      );

      if (!game) {
        client.emit(GameEvents.ERROR, {
          message: 'Не удалось присоединиться к игре',
        });
        return;
      }

      // Присоединяем клиента к комнате
      client.join(data.roomId);

      // Отправляем обновленное состояние игры всем в комнате
      this.server.to(data.roomId).emit(GameEvents.GAME_UPDATE, game);

      // Уведомляем других игроков о новом участнике
      client.to(data.roomId).emit(GameEvents.PLAYER_JOINED, {
        playerName: data.playerName,
        teamId: data.teamId,
      });

      console.log(`Player ${data.playerName} joined room ${data.roomId}`);
    } catch (error) {
      client.emit(GameEvents.ERROR, {
        message: 'Ошибка при присоединении к игре',
      });
    }
  }

  @SubscribeMessage(GameEvents.LEAVE_ROOM)
  handleLeaveRoom(@ConnectedSocket() client: Socket) {
    const result = this.gameService.leaveGame(client.id);
    if (result) {
      client.leave(result.gameId);
      this.server.to(result.gameId).emit(GameEvents.GAME_UPDATE, result.game);
      this.server.to(result.gameId).emit(GameEvents.PLAYER_LEFT, {
        socketId: client.id,
      });
    }
  }

  @SubscribeMessage(GameEvents.START_GAME)
  handleStartGame(@ConnectedSocket() client: Socket) {
    try {
      const game = this.gameService.getGameBySocketId(client.id);
      if (!game) {
        client.emit(GameEvents.ERROR, { message: 'Игра не найдена' });
        return;
      }

      const updatedGame = this.gameService.startGame(game.id, client.id);
      if (!updatedGame) {
        client.emit(GameEvents.ERROR, {
          message: 'Не удалось начать игру. Проверьте, что вы владелец комнаты и в каждой команде есть игроки.',
        });
        return;
      }

      this.server.to(game.id).emit(GameEvents.GAME_UPDATE, updatedGame);
      console.log(`Game started in room ${game.id}`);
    } catch (error) {
      client.emit(GameEvents.ERROR, { message: 'Ошибка при запуске игры' });
    }
  }

  @SubscribeMessage(GameEvents.SPIN_WHEEL)
  handleSpinWheel(@ConnectedSocket() client: Socket) {
    try {
      const game = this.gameService.getGameBySocketId(client.id);
      if (!game) {
        client.emit(GameEvents.ERROR, { message: 'Игра не найдена' });
        return;
      }

      const updatedGame = this.gameService.spinWheel(game.id, client.id);
      if (!updatedGame) {
        client.emit(GameEvents.ERROR, {
          message: 'Только ведущий может крутить колесо',
        });
        return;
      }

      this.server.to(game.id).emit(GameEvents.GAME_UPDATE, updatedGame);
      console.log(`Wheel spun in room ${game.id}`);
    } catch (error) {
      client.emit(GameEvents.ERROR, { message: 'Ошибка при кручении колеса' });
    }
  }

  @SubscribeMessage(GameEvents.SET_ASSOCIATION)
  handleSetAssociation(
    @MessageBody() data: SetAssociationData,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const updatedGame = this.gameService.setAssociation(
        data.roomId,
        client.id,
        data.association,
      );

      if (!updatedGame) {
        client.emit(GameEvents.ERROR, {
          message: 'Только ведущий может задать ассоциацию',
        });
        return;
      }

      this.server.to(data.roomId).emit(GameEvents.GAME_UPDATE, updatedGame);
      console.log(`Association set in room ${data.roomId}: ${data.association}`);
    } catch (error) {
      client.emit(GameEvents.ERROR, {
        message: 'Ошибка при установке ассоциации',
      });
    }
  }

  @SubscribeMessage(GameEvents.MOVE_ARROW)
  handleMoveArrow(
    @MessageBody() data: MoveArrowData,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const updatedGame = this.gameService.moveArrow(
        data.roomId,
        client.id,
        data.position,
      );

      if (!updatedGame) {
        client.emit(GameEvents.ERROR, {
          message: 'Ведущий не может двигать стрелку',
        });
        return;
      }

      this.server.to(data.roomId).emit(GameEvents.GAME_UPDATE, updatedGame);
    } catch (error) {
      client.emit(GameEvents.ERROR, {
        message: 'Ошибка при перемещении стрелки',
      });
    }
  }

  @SubscribeMessage(GameEvents.CONFIRM_ARROW)
  handleConfirmArrow(@ConnectedSocket() client: Socket) {
    try {
      const game = this.gameService.getGameBySocketId(client.id);
      if (!game) {
        client.emit(GameEvents.ERROR, { message: 'Игра не найдена' });
        return;
      }

      const updatedGame = this.gameService.confirmArrow(game.id);
      if (!updatedGame) {
        client.emit(GameEvents.ERROR, {
          message: 'Не удалось подтвердить позицию стрелки',
        });
        return;
      }

      this.server.to(game.id).emit(GameEvents.GAME_UPDATE, updatedGame);
      console.log(`Arrow confirmed in room ${game.id}`);
    } catch (error) {
      client.emit(GameEvents.ERROR, {
        message: 'Ошибка при подтверждении стрелки',
      });
    }
  }
}
