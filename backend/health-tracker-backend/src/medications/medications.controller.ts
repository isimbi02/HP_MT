// ========== medications/medications.controller.ts ==========
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Roles, RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/users/entities/user.entity';
import { MedicationsService } from './medications.service';
import { CreateMedicationDto, UpdateMedicationDto } from './dto/medication.dto';

@ApiTags('Medications')
@Controller('medications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new medication (Admin only)' })
  @ApiResponse({ status: 201, description: 'Medication created successfully' })
  create(@Body() createMedicationDto: CreateMedicationDto) {
    return this.medicationsService.create(createMedicationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all medications' })
  @ApiResponse({ status: 200, description: 'Medications retrieved successfully' })
  findAll() {
    return this.medicationsService.findAll();
  }

  @Get('program/:programId')
  @ApiOperation({ summary: 'Get medications by program ID' })
  @ApiResponse({ status: 200, description: 'Medications retrieved successfully' })
  findByProgram(@Param('programId') programId: string) {
    return this.medicationsService.findByProgram(programId);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get medications by patient ID' })
  @ApiResponse({ status: 200, description: 'Medications retrieved successfully' })
  findByPatient(@Param('patientId') patientId: string) {
    return this.medicationsService.findByPatient(patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get medication by ID' })
  @ApiResponse({ status: 200, description: 'Medication retrieved successfully' })
  findOne(@Param('id') id: string) {
    return this.medicationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update medication (Admin only)' })
  @ApiResponse({ status: 200, description: 'Medication updated successfully' })
  update(@Param('id') id: string, @Body() updateMedicationDto: UpdateMedicationDto) {
    return this.medicationsService.update(id, updateMedicationDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete medication (Admin only)' })
  @ApiResponse({ status: 200, description: 'Medication deleted successfully' })
  remove(@Param('id') id: string) {
    return this.medicationsService.remove(id);
  }
}