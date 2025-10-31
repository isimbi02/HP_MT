// ========== dashboard/dashboard.controller.ts ==========
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get alerts for overdue sessions and inactive enrollments' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  getAlerts() {
    return this.dashboardService.getAlerts();
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Get recent activity' })
  @ApiResponse({ status: 200, description: 'Recent activity retrieved successfully' })
  getRecentActivity() {
    return this.dashboardService.getRecentActivity();
  }
}