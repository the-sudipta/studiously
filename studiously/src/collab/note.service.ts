import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Note } from './entities/note.entity';
import { Project } from './entities/project.entity';
import { UserEntity } from '../member/entities/user.entity';
import { CreateNoteDto, UpdateNoteDto } from './dtos/note.dto';
import { CollabGateway } from './collab.gateway';
import type { Request as ExpressRequest } from 'express';
import { MemberService } from '../member/member.service';

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(Note) private readonly noteRepo: Repository<Note>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly memberService: MemberService,
    private readonly webSocket: CollabGateway,
  ) {}

  async create(dto: CreateNoteDto, req: ExpressRequest): Promise<Note> {
    const { user } = await this.memberService.getAuthContextFromRequest(req);
    if (!user?.id) throw new NotFoundException('User not found');

    const project = await this.projectRepo.findOneBy({ id: dto.projectId });
    if (!project) throw new NotFoundException('Project not found');

    const author = await this.userRepo.findOneBy({ id: user.id });
    if (!author) throw new NotFoundException('Author not found');

    const entity = this.noteRepo.create({
      title: dto.title,
      content: dto.content ?? null,
      project,
      author,
    });

    const saved = await this.noteRepo.save(entity);

    this.webSocket.emitTaskEvent('note.created', {
      id: saved.id,
      title: saved.title,
      projectId: saved.project.id,
    });

    return saved;
  }

  async findAllByProject(
    projectId: number,
    _req: ExpressRequest,
  ): Promise<Note[]> {
    return this.noteRepo.find({
      where: { project: { id: projectId } as any },
      relations: { project: true, author: true },
      order: { id: 'desc' },
    });
  }

  async findOne(id: number, _req: ExpressRequest): Promise<Note> {
    const found = await this.noteRepo.findOne({
      where: { id },
      relations: { project: true, author: true },
    });
    if (!found) throw new NotFoundException('Note not found');
    return found;
  }

  async update(
    id: number,
    dto: UpdateNoteDto,
    req: ExpressRequest,
  ): Promise<Note> {
    const note = await this.findOne(id, req);

    if (dto.title !== undefined) note.title = dto.title;
    if (dto.content !== undefined) note.content = dto.content ?? null;

    const saved = await this.noteRepo.save(note);

    this.webSocket.emitTaskEvent('note.updated', {
      id: saved.id,
      title: saved.title,
      projectId: saved.project.id,
    });

    return saved;
  }

  async remove(id: number, req: ExpressRequest): Promise<void> {
    const note = await this.findOne(id, req);
    await this.noteRepo.remove(note);

    this.webSocket.emitTaskEvent('note.updated', { id, deleted: true });
  }
}
