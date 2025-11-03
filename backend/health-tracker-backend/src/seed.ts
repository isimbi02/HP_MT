import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './users/entities/user.entity';
import { Patient } from './patients/entities/patient.entity';
import { DataSource } from 'typeorm';

async function seed() {
  console.log('🌱 Starting seed...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const userRepository = dataSource.getRepository(User);
  const patientRepository = dataSource.getRepository(Patient);

  try {
    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@healthtracker.com' },
    });

    if (!existingAdmin) {
      // Create Admin User
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const admin = userRepository.create({
      email: 'admin@healthtracker.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      isActive: true,
    });
      await userRepository.save(admin);
      console.log('✅ Admin user created');
      console.log('   Email: admin@healthtracker.com');
      console.log('   Password: Admin@123');
    } else {
      console.log('⚠️  Admin user already exists, skipping');
    }

    // Create Staff User 1
    const existingStaff1 = await userRepository.findOne({
      where: { email: 'staff@healthtracker.com' },
    });
    if (!existingStaff1) {
      const staff1Password = await bcrypt.hash('Staff@123', 10);
      const staff1 = userRepository.create({
        email: 'staff@healthtracker.com',
        password: staff1Password,
        firstName: 'Healthcare',
        lastName: 'Staff',
        role: UserRole.STAFF,
        isActive: true,
      });
      await userRepository.save(staff1);
      console.log('✅ Staff user 1 created');
      console.log('   Email: staff@healthtracker.com');
      console.log('   Password: Staff@123');
    } else {
      console.log('⚠️  Staff user 1 already exists, skipping');
    }

    // Create Staff User 2
    const existingStaff2 = await userRepository.findOne({
      where: { email: 'nurse@healthtracker.com' },
    });
    if (!existingStaff2) {
      const staff2Password = await bcrypt.hash('Nurse@123', 10);
      const staff2 = userRepository.create({
        email: 'nurse@healthtracker.com',
        password: staff2Password,
        firstName: 'Sarah',
        lastName: 'Nurse',
        role: UserRole.STAFF,
        isActive: true,
      });
      await userRepository.save(staff2);
      console.log('✅ Staff user 2 created');
      console.log('   Email: nurse@healthtracker.com');
      console.log('   Password: Nurse@123');
    } else {
      console.log('⚠️  Staff user 2 already exists, skipping');
    }

    // Create Guest User (for testing)
    const existingGuest = await userRepository.findOne({
      where: { email: 'guest@healthtracker.com' },
    });
    if (!existingGuest) {
      const guestPassword = await bcrypt.hash('Guest@123', 10);
      const guest = userRepository.create({
        email: 'guest@healthtracker.com',
        password: guestPassword,
        firstName: 'Test',
        lastName: 'Guest',
        role: UserRole.GUEST,
        isActive: true,
      });
      await userRepository.save(guest);
      console.log('✅ Guest user created');
      console.log('   Email: guest@healthtracker.com');
      console.log('   Password: Guest@123');
    } else {
      console.log('⚠️  Guest user already exists, skipping');
    }

    // Create Patient User 1
    const existingPatient1 = await userRepository.findOne({
      where: { email: 'patient1@healthtracker.com' },
    });
    if (!existingPatient1) {
      const patient1Password = await bcrypt.hash('Patient@123', 10);
      const patient1User = userRepository.create({
        email: 'patient1@healthtracker.com',
        password: patient1Password,
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.PATIENT,
        isActive: true,
      });
      await userRepository.save(patient1User);
      console.log('✅ Patient user 1 created');
      console.log('   Email: patient1@healthtracker.com');
      console.log('   Password: Patient@123');

      // Create matching Patient record for patient1
      const existingPatientRecord1 = await patientRepository.findOne({
        where: { patientNumber: 'PAT001' },
      });
      if (!existingPatientRecord1) {
        const patient1Record = patientRepository.create({
          firstName: 'John',
          lastName: 'Doe',
          patientNumber: 'PAT001',
          dateOfBirth: new Date('1990-05-15'),
          gender: 'Male',
          phoneNumber: '+1234567890',
          email: 'patient1@healthtracker.com',
          address: '123 Main Street, City, State 12345',
          isActive: true,
        });
        await patientRepository.save(patient1Record);
        console.log('✅ Patient record 1 created (PAT001)');
      } else {
        console.log('⚠️  Patient record PAT001 already exists, skipping');
      }
    } else {
      console.log('⚠️  Patient user 1 already exists, skipping');
    }

    // Create Patient User 2
    const existingPatient2 = await userRepository.findOne({
      where: { email: 'patient2@healthtracker.com' },
    });
    if (!existingPatient2) {
      const patient2Password = await bcrypt.hash('Patient@456', 10);
      const patient2User = userRepository.create({
        email: 'patient2@healthtracker.com',
        password: patient2Password,
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.PATIENT,
        isActive: true,
      });
      await userRepository.save(patient2User);
      console.log('✅ Patient user 2 created');
      console.log('   Email: patient2@healthtracker.com');
      console.log('   Password: Patient@456');

      // Create matching Patient record for patient2
      const existingPatientRecord2 = await patientRepository.findOne({
        where: { patientNumber: 'PAT002' },
      });
      if (!existingPatientRecord2) {
        const patient2Record = patientRepository.create({
          firstName: 'Jane',
          lastName: 'Smith',
          patientNumber: 'PAT002',
          dateOfBirth: new Date('1985-08-22'),
          gender: 'Female',
          phoneNumber: '+1234567891',
          email: 'patient2@healthtracker.com',
          address: '456 Oak Avenue, City, State 12346',
          isActive: true,
        });
        await patientRepository.save(patient2Record);
        console.log('✅ Patient record 2 created (PAT002)');
      } else {
        console.log('⚠️  Patient record PAT002 already exists, skipping');
      }
    } else {
      console.log('⚠️  Patient user 2 already exists, skipping');
    }

    // Create Patient User 3
    const existingPatient3 = await userRepository.findOne({
      where: { email: 'patient3@healthtracker.com' },
    });
    if (!existingPatient3) {
      const patient3Password = await bcrypt.hash('Patient@789', 10);
      const patient3User = userRepository.create({
        email: 'patient3@healthtracker.com',
        password: patient3Password,
        firstName: 'Michael',
        lastName: 'Johnson',
        role: UserRole.PATIENT,
        isActive: true,
      });
      await userRepository.save(patient3User);
      console.log('✅ Patient user 3 created');
      console.log('   Email: patient3@healthtracker.com');
      console.log('   Password: Patient@789');

      // Create matching Patient record for patient3
      const existingPatientRecord3 = await patientRepository.findOne({
        where: { patientNumber: 'PAT003' },
      });
      if (!existingPatientRecord3) {
        const patient3Record = patientRepository.create({
          firstName: 'Michael',
          lastName: 'Johnson',
          patientNumber: 'PAT003',
          dateOfBirth: new Date('1992-12-10'),
          gender: 'Male',
          phoneNumber: '+1234567892',
          email: 'patient3@healthtracker.com',
          address: '789 Pine Road, City, State 12347',
          isActive: true,
        });
        await patientRepository.save(patient3Record);
        console.log('✅ Patient record 3 created (PAT003)');
      } else {
        console.log('⚠️  Patient record PAT003 already exists, skipping');
      }
    } else {
      console.log('⚠️  Patient user 3 already exists, skipping');
    }

    console.log('\n✨ Seed completed successfully!\n');
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  }

  await app.close();
  process.exit(0);
}

seed();