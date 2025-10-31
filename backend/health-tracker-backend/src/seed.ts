import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './users/entities/user.entity';
import { DataSource } from 'typeorm';

async function seed() {
  console.log('🌱 Starting seed...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const userRepository = dataSource.getRepository(User);

  try {
    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@healthtracker.com' },
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists, skipping seed');
      await app.close();
      return;
    }

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

    // Create Staff User 1
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

    // Create Staff User 2
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

    // Create Guest User (for testing)
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

    console.log('\n✨ Seed completed successfully!\n');
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  }

  await app.close();
  process.exit(0);
}

seed();