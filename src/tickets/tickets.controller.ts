import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { ParsePositiveIntPipe } from '../common/http/parse-positive-int.pipe.js';
import { PageQueryDto } from '../common/page.js';
import type { User } from '../users/user.model.js';
import { ChangeStatusDto } from './dto/change-status.dto.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { TicketsQueryDto } from './dto/tickets-query.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';
import { TicketsService } from './tickets.service.js';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Get()
  findAll(@Query() query: TicketsQueryDto) {
    return this.tickets.findAll(query);
  }

  @Get(':ticketId')
  findOne(@Param('ticketId', ParsePositiveIntPipe) ticketId: number) {
    return this.tickets.findOne(ticketId);
  }

  @Post()
  async create(
    @Body() dto: CreateTicketDto,
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ticket = await this.tickets.create(dto, user);
    res.location(`/api/v1/tickets/${ticket.id}`);
    return ticket;
  }

  @Patch(':ticketId')
  update(
    @Param('ticketId', ParsePositiveIntPipe) ticketId: number,
    @Body() dto: UpdateTicketDto,
    @CurrentUser() user: User,
  ) {
    return this.tickets.update(ticketId, dto, user);
  }

  @Roles('teacher', 'admin')
  @Post(':ticketId/status')
  @HttpCode(200)
  changeStatus(
    @Param('ticketId', ParsePositiveIntPipe) ticketId: number,
    @Body() dto: ChangeStatusDto,
  ) {
    return this.tickets.changeStatus(ticketId, dto.status);
  }

  @Roles('admin')
  @Delete(':ticketId')
  @HttpCode(204)
  remove(@Param('ticketId', ParsePositiveIntPipe) ticketId: number) {
    return this.tickets.remove(ticketId);
  }

  @Get(':ticketId/comments')
  findComments(
    @Param('ticketId', ParsePositiveIntPipe) ticketId: number,
    @Query() page: PageQueryDto,
  ) {
    return this.tickets.findComments(ticketId, page);
  }

  @Get(':ticketId/comments/:commentId')
  findComment(
    @Param('ticketId', ParsePositiveIntPipe) ticketId: number,
    @Param('commentId', ParsePositiveIntPipe) commentId: number,
  ) {
    return this.tickets.findComment(ticketId, commentId);
  }

  @Post(':ticketId/comments')
  async addComment(
    @Param('ticketId', ParsePositiveIntPipe) ticketId: number,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    const comment = await this.tickets.addComment(ticketId, dto, user);
    res.location(`/api/v1/tickets/${ticketId}/comments/${comment.id}`);
    return comment;
  }
}
