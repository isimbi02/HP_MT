// ========== sessions/sessions.controller.ts ==========
import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionRecordDto, UpdateSessionRecordDto } from './dto/session.dto';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity'; 


@ApiTags('Sessions')
@Controller('sessions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Record a session' })
  @ApiResponse({ status: 201, description: 'Session recorded successfully' })
  create(@Body() createSessionDto: CreateSessionRecordDto, @Request() req) {
    return this.sessionsService.create(createSessionDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all session records' })
  @ApiResponse({ status: 200, description: 'Session records retrieved successfully' })
  findAll() {
    return this.sessionsService.findAll();
  }

  @Get('enrollment/:enrollmentId')
  @ApiOperation({ summary: 'Get sessions by enrollment ID' })
  @ApiResponse({ status: 200, description: 'Session records retrieved successfully' })
  findByEnrollment(@Param('enrollmentId') enrollmentId: string) {
    return this.sessionsService.findByEnrollment(enrollmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session record by ID' })
  @ApiResponse({ status: 200, description: 'Session record retrieved successfully' })
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update session record' })
  @ApiResponse({ status: 200, description: 'Session record updated successfully' })
  update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionRecordDto) {
    return this.sessionsService.update(id, updateSessionDto);
  }
}