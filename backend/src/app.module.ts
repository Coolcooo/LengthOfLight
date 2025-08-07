import { Module } from '@nestjs/common';
import { GameGateway } from './game/game.gateway';
import { GameService } from './game/game.service';
import { GameController } from './game/game.controller';

@Module({
  imports: [],
  controllers: [GameController],
  providers: [GameGateway, GameService],
})
export class AppModule {}
