import { prisma } from '../src/config/database';
import bcrypt from 'bcryptjs';

async function main() {
    const email = 'admin@glowify.com';
    const password = 'password123';

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
        console.log('Admin user already exists');
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await prisma.user.create({
        data: {
            email,
            passwordHash,
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN'
        }
    });

    console.log(`Admin user created: ${email} / ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
