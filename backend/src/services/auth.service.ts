import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';
const JWT_EXPIRES_IN = '7d';

export class AuthService {
    /**
     * Register a new user
     */
    async register(data: { email: string; password: string; firstName?: string; lastName?: string }) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            throw new AppError('Email already registered', 400, 'resource_exists');
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(data.password, salt);

        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                firstName: data.firstName,
                lastName: data.lastName,
                role: 'ADMIN' // Default first user to admin for now
            }
        });

        const token = this.generateToken(user.id);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            },
            token
        };
    }

    /**
     * Login user
     */
    async login(data: { email: string; password: string }) {
        if (!data.email || !data.password) {
            throw new AppError('Email and password are required', 400, 'validation_error');
        }

        const user = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (!user || !user.passwordHash) {
            throw new AppError('Invalid credentials', 401, 'auth_failed');
        }

        const isValid = await bcrypt.compare(data.password, user.passwordHash);

        if (!isValid) {
            throw new AppError('Invalid credentials', 401, 'auth_failed');
        }

        const token = this.generateToken(user.id);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            },
            token
        };
    }

    /**
     * Login or Register with Google
     */
    async googleLogin(data: { email: string; googleId: string; firstName?: string; lastName?: string; avatar?: string }) {
        if (!data.email) {
            throw new AppError('Email is required', 400, 'validation_error');
        }

        let user = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (!user) {
            // Register new user
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(Math.random().toString(36) + data.googleId, salt);

            // Determine role: Force ADMIN for specific email, else USER (default per schema is ADMIN, so we must be explicit)
            const role = data.email === 'meshackmogire406@gmail.com' ? 'ADMIN' : 'USER';

            user = await prisma.user.create({
                data: {
                    email: data.email,
                    googleId: data.googleId,
                    avatar: data.avatar,
                    passwordHash,
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    role: role as any // Casting to any to avoid type error if schema enum isn't updated in types yet
                }
            });
        } else {
            // Update existing user with googleId/avatar if missing (Account Linking)
            if (!user.googleId || !user.avatar) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        googleId: user.googleId || data.googleId,
                        avatar: user.avatar || data.avatar
                    }
                });
            }

            // Force Upgrade to ADMIN if it's the specific email and not already
            if (data.email === 'meshackmogire406@gmail.com' && user.role !== 'ADMIN') {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { role: 'ADMIN' }
                });
            }
        }

        const token = this.generateToken(user.id);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                avatar: user.avatar
            },
            token
        };
    }

    private generateToken(userId: string): string {
        return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }
}

export const authService = new AuthService();