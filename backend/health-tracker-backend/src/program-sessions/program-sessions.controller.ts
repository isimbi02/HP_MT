import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ProgramSessionsService } from './program-sessions.service';
import { CreateProgramSessionDto, UpdateProgramSessionDto } from './dto/program-session.dto';
import { Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Program Sessions')
@Controller('program-sessions')
export class ProgramSessionsController {
  constructor(private readonly sessionsService: ProgramSessionsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new program session (Admin only)' })
  @ApiResponse({ status: 201, description: 'Session created successfully' })
  create(@Body() createDto: CreateProgramSessionDto) {
    return this.sessionsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all program sessions (Public - available to guests)' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  findAll(@Query('programId') programId?: string, @Query('upcomingOnly') upcomingOnly?: string) {
    return this.sessionsService.findAll(programId, upcomingOnly === 'true');
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available sessions for booking (Public - available to guests)' })
  @ApiResponse({ status: 200, description: 'Available sessions retrieved successfully' })
  getAvailable(@Query('programId') programId?: string) {
    return this.sessionsService.getAvailableSessions(programId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session by ID (Public - available to guests)' })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update session (Admin only)' })
  @ApiResponse({ status: 200, description: 'Session updated successfully' })
  update(@Param('id') id: string, @Body() updateDto: UpdateProgramSessionDto) {
    return this.sessionsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete session (Admin only)' })
  @ApiResponse({ status: 200, description: 'Session deleted successfully' })
  remove(@Param('id') id: string) {
    return this.sessionsService.remove(id);
  }
}

