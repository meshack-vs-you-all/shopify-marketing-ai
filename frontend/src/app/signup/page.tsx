'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
    EyeIcon,
    EyeSlashIcon,
    EnvelopeIcon,
    LockClosedIcon,
    UserIcon,
} from '@heroicons/react/24/outline';

const registerSchema = z.object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function SignupPage() {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterForm) => {
        try {
            setIsLoading(true);
            setError('');

            await api.register({
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
            });

            // Redirect to login on success
            router.push('/login?registered=true');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white dark:bg-gray-900">
            {/* Left Column - Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full lg:w-[480px] xl:w-[560px]">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Create an account
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Already have an account?{' '}
                            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <div className="mt-8">
                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            {error && (
                                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-100 dark:border-red-800">
                                    <div className="flex">
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{error}</h3>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">First Name</label>
                                    <div className="relative rounded-lg shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        </div>
                                        <input
                                            type="text"
                                            className={`block w-full pl-10 pr-3 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 transition-shadow bg-gray-50 dark:bg-gray-800 dark:text-white ${errors.firstName ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'}`}
                                            placeholder="John"
                                            {...register('firstName')}
                                        />
                                    </div>
                                    {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Last Name</label>
                                    <div className="relative rounded-lg shadow-sm">
                                        <input
                                            type="text"
                                            className={`block w-full px-3 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 transition-shadow bg-gray-50 dark:bg-gray-800 dark:text-white ${errors.lastName ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'}`}
                                            placeholder="Doe"
                                            {...register('lastName')}
                                        />
                                    </div>
                                    {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                                <div className="relative rounded-lg shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                    </div>
                                    <input
                                        type="email"
                                        className={`block w-full pl-10 pr-3 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 transition-shadow bg-gray-50 dark:bg-gray-800 dark:text-white ${errors.email ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'}`}
                                        placeholder="you@example.com"
                                        {...register('email')}
                                    />
                                </div>
                                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                                <div className="relative rounded-lg shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className={`block w-full pl-10 pr-10 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 transition-shadow bg-gray-50 dark:bg-gray-800 dark:text-white ${errors.password ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'}`}
                                        placeholder="••••••••"
                                        {...register('password')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                                    >
                                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
                                <div className="relative rounded-lg shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className={`block w-full pl-10 pr-3 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 transition-shadow bg-gray-50 dark:bg-gray-800 dark:text-white ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'}`}
                                        placeholder="••••••••"
                                        {...register('confirmPassword')}
                                    />
                                </div>
                                {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
                            </div>

                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                By creating an account, you agree to our <Link href="/terms" className="text-indigo-600 hover:underline">Terms</Link> and <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>.
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? 'Creating account...' : 'Create Account'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Right Column - Image/Marketing */}
            <div className="hidden lg:block relative w-0 flex-1 bg-gray-50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] opacity-20 mix-blend-overlay bg-cover bg-center" />
                </div>
                <div className="absolute inset-0 flex flex-col justify-end p-20 z-10 text-white">
                    <h1 className="text-4xl font-bold mb-4">Join the Future of Marketing</h1>
                    <p className="text-lg text-gray-300">Start creating AI-powered campaigns in minutes.</p>
                </div>
            </div>
        </div>
    );
}
