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
import { NoteService } from './note.service';
import { CreateNoteDto, UpdateNoteDto } from './dtos/note.dto';
import { AuthGuard } from '../member/auth/auth.guard';
import { Roles, RolesGuard } from '../member/auth/roles.guard';
import type { Request as ExpressRequest } from 'express';

@Controller('api/notes')
@UseGuards(AuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class NoteController {
  constructor(private readonly notes: NoteService) {}

  @Post('/create')
  @Roles('admin', 'member')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateNoteDto, @Req() req: ExpressRequest) {
    return this.notes.create(dto, req);
  }

  // list notes for a project
  @Get('/list')
  @Roles('admin', 'member')
  @HttpCode(HttpStatus.OK)
  list(
    @Query('projectId', ParseIntPipe) projectId: number,
    @Req() req: ExpressRequest,
  ) {
    return this.notes.findAllByProject(projectId, req);
  }

  @Get(':id')
  @Roles('admin', 'member')
  @HttpCode(HttpStatus.OK)
  getOne(@Param('id', ParseIntPipe) id: number, @Req() req: ExpressRequest) {
    return this.notes.findOne(id, req);
  }

  @Patch(':id')
  @Roles('admin', 'member')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNoteDto,
    @Req() req: ExpressRequest,
  ) {
    return this.notes.update(id, dto, req);
  }

  @Delete(':id')
  @Roles('admin', 'member')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: ExpressRequest,
  ) {
    await this.notes.remove(id, req);
  }
}
