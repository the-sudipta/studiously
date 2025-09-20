import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto } from './dtos/task.dto';
import { AuthGuard } from '../member/auth/auth.guard';
import { Roles, RolesGuard } from '../member/auth/roles.guard';
import type { Request as ExpressRequest } from 'express';

@Controller('api/tasks')
@UseGuards(AuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class TaskController {
  constructor(private readonly tasks: TaskService) {}

  @Post('/create')
  @Roles('admin', 'member')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTaskDto, @Req() req: ExpressRequest) {
    return this.tasks.create(dto, req);
  }

  // list tasks for a project
  @Get('/list')
  @Roles('admin', 'member')
  @HttpCode(HttpStatus.OK)
  list(
    @Query('projectId', ParseIntPipe) projectId: number,
    @Req() req: ExpressRequest,
  ) {
    return this.tasks.findAllByProject(projectId, req);
  }

  @Get(':id')
  @Roles('admin', 'member')
  @HttpCode(HttpStatus.OK)
  getOne(@Param('id', ParseIntPipe) id: number, @Req() req: ExpressRequest) {
    return this.tasks.findOne(id, req);
  }

  @Patch(':id')
  @Roles('admin', 'member')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
    @Req() req: ExpressRequest,
  ) {
    return this.tasks.update(id, dto, req);
  }

  @Delete(':id')
  @Roles('admin', 'member')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: ExpressRequest,
  ) {
    await this.tasks.remove(id, req);
  }
}
