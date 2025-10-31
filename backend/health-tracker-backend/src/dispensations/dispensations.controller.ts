// ========== dispensations/dispensations.controller.ts ==========
import { Controller, Get, Post, Body,  Param, UseGuards, Request} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Roles, RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/users/entities/user.entity';
import { DispensationsService } from './dispensations.service';
import { CreateDispensationDto, CheckEligibilityDto } from './dto/dispensation.dto';

@ApiTags('Dispensations')
@Controller('dispensations')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DispensationsController {
  constructor(private readonly dispensationsService: DispensationsService) {}

  @Post('check-eligibility')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Check if patient is eligible for medication' })
  @ApiResponse({ status: 200, description: 'Eligibility checked successfully' })
  checkEligibility(@Body() checkDto: CheckEligibilityDto) {
    return this.dispensationsService.checkEligibility(checkDto);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Dispense medication to patient' })
  @ApiResponse({ status: 201, description: 'Medication dispensed successfully' })
  @ApiResponse({ status: 409, description: 'Medication already collected' })
  create(@Body() createDispensationDto: CreateDispensationDto, @Request() req) {
    return this.dispensationsService.create(createDispensationDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all dispensations' })
  @ApiResponse({ status: 200, description: 'Dispensations retrieved successfully' })
  findAll() {
    return this.dispensationsService.findAll();
  }

  @Get('enrollment/:enrollmentId')
  @ApiOperation({ summary: 'Get dispensations by enrollment ID' })
  @ApiResponse({ status: 200, description: 'Dispensations retrieved successfully' })
  findByEnrollment(@Param('enrollmentId') enrollmentId: string) {
    return this.dispensationsService.findByEnrollment(enrollmentId);
  }
}