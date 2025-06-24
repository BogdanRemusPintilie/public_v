
import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email is too long'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password is too long')
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Enhanced input sanitization helper
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>'"&]/g, '') // Remove potential XSS characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 1000); // Limit length
};

// Additional validation for Excel content
export const sanitizeExcelContent = (content: any): any => {
  if (typeof content === 'string') {
    return sanitizeInput(content);
  }
  if (typeof content === 'object' && content !== null) {
    const sanitized: any = {};
    for (const key in content) {
      if (content.hasOwnProperty(key)) {
        sanitized[sanitizeInput(key)] = sanitizeExcelContent(content[key]);
      }
    }
    return sanitized;
  }
  return content;
};
