// ========== dashboard/dashboard.controller.ts ==========
import { Controller, Get, UseGuards, Request, Param, Res, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Response } from 'express';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get role-based dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  getDashboard(@Request() req) {
    return this.dashboardService.getDashboardByRole(req.user.id, req.user.role);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get enhanced alerts for overdue sessions and medications' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  getAlerts() {
    return this.dashboardService.getEnhancedAlerts();
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Get recent activity' })
  @ApiResponse({ status: 200, description: 'Recent activity retrieved successfully' })
  getRecentActivity() {
    return this.dashboardService.getRecentActivity();
  }

  @Get('charts')
  @ApiOperation({ summary: 'Get chart data for progress tracking' })
  @ApiResponse({ status: 200, description: 'Chart data retrieved successfully' })
  getCharts() {
    return this.dashboardService.getChartsData();
  }

  @Get('patient-dashboard')
  @ApiOperation({ summary: 'Get patient/guest dashboard' })
  @ApiResponse({ status: 200, description: 'Patient dashboard retrieved successfully' })
  getPatientDashboard(@Request() req) {
    return this.dashboardService.getPatientDashboard(req.user.id);
  }

  @Get('export-progress/:patientId')
  @ApiOperation({ summary: 'Export patient progress report as CSV' })
  @ApiResponse({ status: 200, description: 'CSV exported successfully' })
  async exportProgress(@Param('patientId') patientId: string, @Res() res: Response) {
    const csv = await this.dashboardService.exportPatientProgressReport(patientId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="patient-progress-${patientId}.csv"`);
    res.send(csv);
  }
}