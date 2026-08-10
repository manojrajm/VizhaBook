import { z } from 'zod';

export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email or Phone Number is required'),
    password: z
        .string()
        .min(1, 'Password is required')
});

export const signupSchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters long'),
    phone: z
        .string()
        .regex(/^\d{7,15}$/, 'Phone number must contain between 7 and 15 digits'),
    countryCode: z
        .string()
        .default('+91'),
    email: z
        .string()
        .min(1, 'Email address is required')
        .email('Please enter a valid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters long')
        .regex(/[0-9]/, 'Password must contain at least 1 number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least 1 special character/symbol'),
    confirmPassword: z
        .string()
        .min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
});
