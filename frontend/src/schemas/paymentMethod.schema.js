import { z } from 'zod';

const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

export const paymentMethodSchema = z.object({
    name: z
        .string()
        .min(2, 'Display Name must be at least 2 characters')
        .max(100, 'Display Name must not exceed 100 characters'),
    method_type: z.enum(['UPI', 'CASH', 'BANK_TRANSFER', 'OTHER'], {
        errorMap: () => ({ message: 'Method Type must be UPI, Cash, Bank Transfer, or Other' })
    }),
    provider: z
        .string()
        .max(50, 'Provider name must not exceed 50 characters')
        .optional()
        .or(z.literal('')),
    upi_id: z
        .string()
        .optional()
        .or(z.literal('')),
    is_active: z.boolean().default(true),
    is_default: z.boolean().default(false),
    display_order: z.number().optional().default(0)
}).refine((data) => {
    if (data.method_type === 'UPI') {
        if (!data.upi_id || !data.upi_id.trim()) {
            return false;
        }
    }
    return true;
}, {
    message: 'UPI ID is required for UPI payment methods',
    path: ['upi_id']
}).refine((data) => {
    if (data.method_type === 'UPI' && data.upi_id && data.upi_id.trim()) {
        return upiRegex.test(data.upi_id.trim());
    }
    return true;
}, {
    message: 'Please enter a valid UPI ID format (e.g. name@oksbi)',
    path: ['upi_id']
});
