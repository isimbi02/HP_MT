// ========== sessions/sessions.module.ts ==========
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { SessionRecord } from './entities/session-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SessionRecord])],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}