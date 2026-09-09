import { z } from 'zod';

export const adminLoginSchema = z.object({
    email: z.string().email('Please enter a valid admin email address'),
    password: z.string().min(1, 'Password is required')
});

export const manualSubscriptionSchema = z.object({
    planId: z.string().min(1, 'Subscription plan is required'),
    duration: z.enum(['1_MONTH', '3_MONTHS', '6_MONTHS', '1_YEAR'], {
        errorMap: () => ({ message: 'Please select a valid subscription duration' })
    }),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'MANUAL', 'ONLINE'], {
        errorMap: () => ({ message: 'Please select a valid payment method' })
    }),
    amount: z.number().min(0, 'Payment amount must be 0 or greater').or(
        z.string().regex(/^\d+(\.\d{1,2})?$/).transform(val => parseFloat(val))
    ),
    notes: z.string().optional()
});

export const validateAdminPayload = (schema) => (req, res, next) => {
    try {
        const validated = schema.parse(req.body);
        req.body = validated;
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            const issues = error.issues || error.errors || [];
            const formattedErrors = issues.map(err => err.message).join(', ');
            return res.status(400).json({
                success: false,
                error: formattedErrors || 'Validation failed.',
                details: issues
            });
        }
        return res.status(400).json({
            success: false,
            error: 'Invalid request payload.'
        });
    }
};
