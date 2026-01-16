
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function bootstrapAdmin() {
    const adminEmail = 'meshackmogire406@gmail.com';
    const adminPassword = process.env.ADMIN_INIT_PASSWORD || 'ChangeMe123!';

    console.log(`[Bootstrap] Checking for admin user: ${adminEmail}`);

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (existingUser) {
            console.log(`[Bootstrap] User found. Verifying role...`);
            if (existingUser.role !== 'ADMIN') {
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { role: 'ADMIN' }
                });
                console.log(`[Bootstrap] SUCCESS: User promoted to ADMIN.`);
            } else {
                console.log(`[Bootstrap] User is already ADMIN. No changes needed.`);
            }
        } else {
            console.log(`[Bootstrap] User not found. Creating new ADMIN...`);
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(adminPassword, salt);

            await prisma.user.create({
                data: {
                    email: adminEmail,
                    passwordHash,
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'ADMIN',
                    // Optional: pre-fill googleId if known, otherwise it will link on first login
                }
            });
            console.log(`[Bootstrap] SUCCESS: Admin user created.`);
        }
    } catch (error) {
        console.error(`[Bootstrap] ERROR: Failed to bootstrap admin.`, error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

bootstrapAdmin();
