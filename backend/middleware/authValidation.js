import { z } from 'zod';

export const signupValidationSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().regex(/^\d{7,15}$/, 'Phone number must contain between 7 and 15 digits'),
    countryCode: z.string().default('+91'),
    password: z.string().min(6, 'Password must be at least 6 characters long')
});

export const loginValidationSchema = z.object({
    email: z.string().min(1, 'Email or Phone Number is required'),
    password: z.string().min(1, 'Password is required')
});

export const validateRequest = (schema) => (req, res, next) => {
    try {
        const validatedData = schema.parse(req.body);
        req.body = validatedData;
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
