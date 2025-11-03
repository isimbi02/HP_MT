import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ActivityLogsService } from './activity-logs.service';
import { Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Activity Logs')
@Controller('activity-logs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ActivityLogsController {
  constructor(private readonly logsService: ActivityLogsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all activity logs (Admin/Staff only)' })
  @ApiResponse({ status: 200, description: 'Activity logs retrieved successfully' })
  findAll(@Query('userId') userId?: string, @Query('targetType') targetType?: string, @Query('limit') limit?: string) {
    return this.logsService.findAll(userId, targetType, limit ? parseInt(limit) : 100);
  }

  @Get('my-activity')
  @ApiOperation({ summary: 'Get my activity logs' })
  @ApiResponse({ status: 200, description: 'Activity logs retrieved successfully' })
  getMyActivity(@Query('limit') limit?: string) {
    // Note: userId should come from request user, will be implemented in service
    return this.logsService.findAll(undefined, undefined, limit ? parseInt(limit) : 50);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get activity log by ID' })
  @ApiResponse({ status: 200, description: 'Activity log retrieved successfully' })
  findOne(@Param('id') id: string) {
    return this.logsService.findOne(id);
  }
}

