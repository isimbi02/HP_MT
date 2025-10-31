// ========== src/app.module.ts ==========
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProgramsModule } from './programs/programs.module';
import { PatientsModule } from './patients/patients.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { SessionsModule } from './sessions/sessions.module';
import { MedicationsModule } from './medications/medications.module';
import { DispensationsModule } from './dispensations/dispensations.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    // Load .env file globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Database connection (PostgreSQL)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // ⚠️ Set to false in production
        logging: false,
      }),
      inject: [ConfigService],
    }),

    // Application modules
    AuthModule,
    UsersModule,
    ProgramsModule,
    PatientsModule,
    EnrollmentsModule,
    SessionsModule,
    MedicationsModule,
    DispensationsModule,
    DashboardModule,
  ],
})
export class AppModule {}
