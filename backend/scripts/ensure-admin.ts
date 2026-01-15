import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function ensureAdmin() {
    const email = 'meshackmogire406@gmail.com';
    console.log(`Checking for admin user: ${email}...`);

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (user) {
            console.log(`User found: ${user.id}`);
            if (user.role !== 'ADMIN') {
                console.log('User is not ADMIN. Updating role...');
                await prisma.user.update({
                    where: { id: user.id },
                    data: { role: 'ADMIN' },
                });
                console.log('✅ User role updated to ADMIN.');
            } else {
                console.log('✅ User is already ADMIN.');
            }
        } else {
            console.log('User not found. Creating new ADMIN user...');
            const salt = await bcrypt.genSalt(10);
            // Random password, they should use Google to login
            const passwordHash = await bcrypt.hash(
                `admin-${Math.random().toString(36).slice(2)}`,
                salt
            );

            const newUser = await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    firstName: 'Meshack',
                    lastName: 'Mogire',
                    role: 'ADMIN',
                },
            });
            console.log(`✅ Admin user created: ${newUser.id}`);
            console.log('NOTE: Password is random. Please login via Google Sign-In.');
        }
    } catch (error) {
        console.error('Error ensuring admin:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

ensureAdmin();
