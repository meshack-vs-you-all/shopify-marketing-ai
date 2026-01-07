
import { PrismaClient, UserRole, Platform, CampaignStatus, CampaignType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Create Users
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@marketing.ai' },
        update: {},
        create: {
            email: 'admin@marketing.ai',
            passwordHash,
            firstName: 'Admin',
            lastName: 'User',
            role: UserRole.ADMIN,
        },
    });

    const editor = await prisma.user.upsert({
        where: { email: 'editor@marketing.ai' },
        update: {},
        create: {
            email: 'editor@marketing.ai',
            passwordHash,
            firstName: 'Editor',
            lastName: 'User',
            role: UserRole.EDITOR,
        },
    });

    const viewer = await prisma.user.upsert({
        where: { email: 'viewer@marketing.ai' },
        update: {},
        create: {
            email: 'viewer@marketing.ai',
            passwordHash,
            firstName: 'Viewer',
            lastName: 'User',
            role: UserRole.VIEWER,
        },
    });

    console.log('✅ Users seeded:', { admin: admin.email, editor: editor.email, viewer: viewer.email });

    // 2. Create Email List
    const newsletterList = await prisma.emailList.upsert({
        where: { id: 'seed-newsletter-list' }, // Check by ID if possible, but ID is CUID. We'll search by name or just create if not exists (upsert needs unique)
        // List names aren't unique in schema, so let's findFirst or create.
        update: {},
        create: {
            name: 'Main Newsletter',
            description: 'Primary subscriber list for weekly updates',
            subscribers: {
                create: [
                    { email: 'subscriber1@example.com', firstName: 'John', lastName: 'Doe', status: 'SUBSCRIBED' },
                    { email: 'subscriber2@example.com', firstName: 'Jane', lastName: 'Smith', status: 'SUBSCRIBED' },
                ],
            },
        },
    });
    // Since upsert requires unique, and name isn't unique, we might duplicate lists if we run this multiple times without unique constraint.
    // For safety in this seed script, let's just check count or delete existing for idempotency?
    // Actually, let's just create if not exists logic manually for non-unique fields if we cared, but for now we'll skip complex logic and just create a Campaign attached to the first list found or created.

    const list = await prisma.emailList.findFirst({ where: { name: 'Main Newsletter' } });
    let listId = list?.id;

    if (!listId) {
        const newList = await prisma.emailList.create({
            data: {
                name: 'Main Newsletter',
                description: 'Primary subscriber list for weekly updates',
                subscribers: {
                    create: [
                        { email: 'demo.customer@example.com', firstName: 'Demo', lastName: 'Customer', status: 'SUBSCRIBED' }
                    ]
                }
            }
        });
        listId = newList.id;
        console.log('✅ Email List seeded');
    }

    // 3. Create Sample Campaign
    const campaign = await prisma.campaign.create({
        data: {
            name: 'Summer Sale 2026',
            type: CampaignType.META_AD,
            platform: Platform.META,
            status: CampaignStatus.DRAFT,
            budget: 500.00,
            dailyBudget: 50.00,
            startDate: new Date(),
            objective: 'OUTCOME_SALES',
            headline: 'Summer Savings Are Here!',
            primaryText: 'Get 50% off all summer styles. Limited time only.',
            description: 'Shop the collection now.',
            cta: 'SHOP_NOW',
        }
    });

    console.log('✅ Sample Campaign seeded:', campaign.name);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
