import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default('3000'),
    MONGODB_URI: z.string().url(),
    JWT_SECRET: z.string().min(32),
    CORS_ORIGIN: z.string().default('*'),
    REDIS_URL: z.string().url().optional(),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
    // Notification secrets
    SENDGRID_API_KEY: z.string().optional(),
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    // ... add other necessary env vars here
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(_env.error.format(), null, 2));
    process.exit(1);
}

export const env = _env.data;
