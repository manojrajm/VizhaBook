import { z } from 'zod';

export const functionSchema = z.object({
    name: z
        .string()
        .min(2, 'Function name must be at least 2 characters')
        .max(150, 'Function name must not exceed 150 characters'),
    event_date: z
        .string()
        .min(1, 'Event date is required')
        .refine((val) => !isNaN(Date.parse(val)), { message: 'Please enter a valid date' }),
    location: z
        .string()
        .max(255, 'Location must not exceed 255 characters')
        .optional()
        .or(z.literal('')),
    description: z
        .string()
        .optional()
        .or(z.literal('')),
    status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED'], {
        errorMap: () => ({ message: 'Status must be Active, Completed, or Archived' })
    })
});
