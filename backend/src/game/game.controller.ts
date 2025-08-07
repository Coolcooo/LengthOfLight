import { Controller, Post, Get, Param } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private gameService: GameService) {}

  @Post('create')
  createGame() {
    const gameId = this.gameService.createGame();
    return { gameId };
  }

  @Get(':id')
  getGame(@Param('id') id: string) {
    const game = this.gameService.getGame(id);
    if (!game) {
      return { error: 'Game not found' };
    }
    return game;
  }
}
