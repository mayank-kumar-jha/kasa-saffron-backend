import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateAdmin() {
  try {
    const newEmail = 'admin@gmail.com';
    const newPassword = 'yash91597';
    const oldEmail = '12345admin@gmail.com';

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Try to update existing admin@gmail.com
    let newAdmin = await prisma.user.findUnique({ where: { email: newEmail } });
    if (newAdmin) {
      console.log('admin@gmail.com exists, updating password and role...');
      await prisma.user.update({
        where: { email: newEmail },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
        },
      });
      console.log('Password updated successfully.');
    } else {
      console.log('Creating new admin@gmail.com...');
      await prisma.user.create({
        data: {
          email: newEmail,
          name: 'Kasa Admin',
          password: hashedPassword,
          role: 'ADMIN',
        }
      });
      console.log('Created successfully.');
    }

    // Try to delete old admin
    const oldAdmin = await prisma.user.findUnique({ where: { email: oldEmail } });
    if (oldAdmin) {
      console.log('Deleting old 12345admin@gmail.com...');
      await prisma.user.delete({ where: { email: oldEmail } });
      console.log('Deleted successfully.');
    }

  } catch (error) {
    console.error('Error updating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdmin();
