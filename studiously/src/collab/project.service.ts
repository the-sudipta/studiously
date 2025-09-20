import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto, UpdateProjectDto } from './dtos/project.dto';
import { UserEntity } from '../member/entities/user.entity';
import { CollabGateway } from './collab.gateway';
import { MemberService } from '../member/member.service';
import type { Request as ExpressRequest } from 'express';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project) private readonly repo: Repository<Project>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly memberService: MemberService,
    private readonly webSocket: CollabGateway,
  ) {}

  async create(dto: CreateProjectDto, req: ExpressRequest): Promise<Project> {
    const { user } = await this.memberService.getAuthContextFromRequest(req);
    if (!user?.id) throw new NotFoundException('Owner not found');

    const owner = await this.userRepo.findOneBy({ id: user.id });
    if (!owner) throw new NotFoundException('Owner not found');

    const entity = this.repo.create({
      title: dto.title,
      summary: dto.summary ?? null,
      owner,
    });

    const saved = await this.repo.save(entity);

    // lightweight WS event (optional)
    this.webSocket.emitTaskEvent('project.updated', {
      id: saved.id,
      title: saved.title,
    });

    return saved;
  }

  async findAll(req: ExpressRequest): Promise<Project[]> {
    const { user } = await this.memberService.getAuthContextFromRequest(req);

    if (user?.role === 'admin') {
      return this.repo.find({
        relations: { owner: true },
        order: { id: 'desc' },
      });
    }
    if (!user?.id) throw new NotFoundException('Owner not found');

    return this.repo.find({
      where: { owner: { id: user.id } },
      relations: { owner: true },
      order: { id: 'desc' },
    });
  }

  private async loadAndAuthorize(
    id: number,
    req: ExpressRequest,
  ): Promise<Project> {
    const { user } = await this.memberService.getAuthContextFromRequest(req);

    const found = await this.repo.findOne({
      where: { id },
      relations: { owner: true },
    });
    if (!found) throw new NotFoundException('Project not found');

    if (user?.role !== 'admin' && found.owner?.id !== user?.id) {
      throw new ForbiddenException('Not your project');
    }
    return found;
  }

  async findOne(id: number, req: ExpressRequest): Promise<Project> {
    return this.loadAndAuthorize(id, req);
  }

  async update(
    id: number,
    dto: UpdateProjectDto,
    req: ExpressRequest,
  ): Promise<Project> {
    const project = await this.loadAndAuthorize(id, req);

    if (dto.title !== undefined) project.title = dto.title;
    if (dto.summary !== undefined) project.summary = dto.summary ?? null;

    const saved = await this.repo.save(project);
    this.webSocket.emitTaskEvent('project.updated', {
      id: saved.id,
      title: saved.title,
    });
    return saved;
  }

  async remove(id: number, req: ExpressRequest): Promise<void> {
    await this.loadAndAuthorize(id, req);

    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException('Project not found');

    this.webSocket.emitTaskEvent('project.updated', { id, deleted: true });
  }
}
