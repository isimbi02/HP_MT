import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SessionBookingsService } from './session-bookings.service';
import { CreateSessionBookingDto, UpdateSessionBookingDto } from './dto/session-booking.dto';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Session Bookings')
@Controller('session-bookings')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class SessionBookingsController {
  constructor(private readonly bookingsService: SessionBookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Book a session' })
  @ApiResponse({ status: 201, description: 'Session booked successfully' })
  create(@Body() createDto: CreateSessionBookingDto, @Request() req) {
    return this.bookingsService.create(createDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookings' })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully' })
  findAll(@Query('userId') userId?: string, @Query('patientId') patientId?: string, @Query('sessionId') sessionId?: string) {
    return this.bookingsService.findAll(userId, patientId, sessionId);
  }

  @Get('my-bookings')
  @ApiOperation({ summary: 'Get my bookings (for patients/guests)' })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully' })
  getMyBookings(@Request() req) {
    return this.bookingsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update booking status' })
  @ApiResponse({ status: 200, description: 'Booking updated successfully' })
  update(@Param('id') id: string, @Body() updateDto: UpdateSessionBookingDto, @Request() req) {
    return this.bookingsService.update(id, updateDto, req.user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
  cancel(@Param('id') id: string, @Request() req) {
    return this.bookingsService.cancel(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete booking' })
  @ApiResponse({ status: 200, description: 'Booking deleted successfully' })
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(id);
  }
}

