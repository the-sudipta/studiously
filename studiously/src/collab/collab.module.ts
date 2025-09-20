import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Task } from './entities/task.entity';
import { Note } from './entities/note.entity';
import { ProjectController } from './project.controller';
import { TaskController } from './task.controller';
import { NoteController } from './note.controller';
import { UserEntity } from '../member/entities/user.entity';
import { CollabGateway } from './collab.gateway';
import { AuthModule } from '../member/auth/auth.module';
import { MemberModule } from '../member/member.module';
import { ProjectService } from './project.service';
import { TaskService } from './task.service';
import { NoteService } from './note.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Task, Note, UserEntity]),
    AuthModule,
    MemberModule,
  ],
  controllers: [ProjectController, TaskController, NoteController],
  providers: [CollabGateway, ProjectService, TaskService, NoteService],
  exports: [CollabGateway],
})
export class CollabModule {}
