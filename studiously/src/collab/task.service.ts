import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { Project } from './entities/project.entity';
import { UserEntity } from '../member/entities/user.entity';
import { CreateTaskDto, UpdateTaskDto } from './dtos/task.dto';
import { CollabGateway } from './collab.gateway';
import type { Request as ExpressRequest } from 'express';
import { MemberService } from '../member/member.service';

function toDateOrNull(v?: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly memberService: MemberService,
    private readonly webSocket: CollabGateway,
  ) {}

  async create(dto: CreateTaskDto, req: ExpressRequest): Promise<Task> {
    // current user (not strictly required for creation, but available for auditing/permission)
    const { user } = await this.memberService.getAuthContextFromRequest(req);
    if (!user?.id) throw new NotFoundException('User not found');

    const project = await this.projectRepo.findOneBy({ id: dto.projectId });
    if (!project) throw new NotFoundException('Project not found');

    const assignee =
      dto.assigneeId != null
        ? await this.userRepo.findOneBy({ id: dto.assigneeId })
        : null;

    const entity = this.taskRepo.create({
      title: dto.title,
      details: dto.details ?? null,
      status: dto.status ?? TaskStatus.TODO,
      due_at: toDateOrNull(dto.due_at),
      project,
      assignee: assignee ?? null,
    });

    const saved = await this.taskRepo.save(entity);

    this.webSocket.emitTaskEvent('task.created', {
      id: saved.id,
      title: saved.title,
      projectId: saved.project.id,
    });

    return saved;
  }

  async findAllByProject(
    projectId: number,
    _req: ExpressRequest,
  ): Promise<Task[]> {
    return this.taskRepo.find({
      where: { project: { id: projectId } as any },
      relations: { project: true, assignee: true },
      order: { id: 'desc' },
    });
  }

  async findOne(id: number, _req: ExpressRequest): Promise<Task> {
    const found = await this.taskRepo.findOne({
      where: { id },
      relations: { project: true, assignee: true },
    });
    if (!found) throw new NotFoundException('Task not found');
    return found;
  }

  async update(
    id: number,
    dto: UpdateTaskDto,
    req: ExpressRequest,
  ): Promise<Task> {
    const task = await this.findOne(id, req);

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.details !== undefined) task.details = dto.details ?? null;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.due_at !== undefined) task.due_at = toDateOrNull(dto.due_at);

    if (dto.assigneeId !== undefined) {
      task.assignee =
        dto.assigneeId != null
          ? await this.userRepo.findOneBy({ id: dto.assigneeId })
          : null;
    }

    const saved = await this.taskRepo.save(task);

    this.webSocket.emitTaskEvent('task.updated', {
      id: saved.id,
      title: saved.title,
      projectId: saved.project.id,
    });

    return saved;
  }

  async remove(id: number, req: ExpressRequest): Promise<void> {
    const task = await this.findOne(id, req);
    await this.taskRepo.remove(task);
    this.webSocket.emitTaskEvent('task.updated', { id, deleted: true });
  }
}
