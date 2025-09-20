import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto } from './dtos/project.dto';
import { AuthGuard } from '../member/auth/auth.guard';
import { Roles, RolesGuard } from '../member/auth/roles.guard';
import type { Request as ExpressRequest } from 'express';

@Controller('api/projects')
@UseGuards(AuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ProjectController {
  constructor(private readonly projects: ProjectService) {}

  // create a new project for an owner (owner provided via query or will come later from req.user)
  @Post('/create')
  @Roles('admin', 'member')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProjectDto, @Req() req: ExpressRequest) {
    return this.projects.create(dto, req);
  }

  @Get('/list')
  @Roles('admin', 'member')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.OK)
  list(@Req() req: ExpressRequest) {
    return this.projects.findAll(req);
  }

  @Get(':id')
  @Roles('admin', 'member')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.OK)
  getOne(@Param('id') id: number, @Req() req: ExpressRequest) {
    return this.projects.findOne(+id, req);
  }

  @Put(':id')
  @Roles('admin', 'member')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: number,
    @Body() dto: UpdateProjectDto,
    @Req() req: ExpressRequest,
  ) {
    return this.projects.update(+id, dto, req);
  }

  @Delete(':id')
  @Roles('admin', 'member')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: number, @Req() req: ExpressRequest) {
    return this.projects.remove(+id, req);
  }
}
