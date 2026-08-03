import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('bullmq', () => {
    return {
        Queue: vi.fn(function() {
            return { add: vi.fn() };
        }),
        QueueEvents: vi.fn(function() {
            return { on: vi.fn() };
        }),
    };
});

vi.mock('./db/config.js', () => {
    return {
        default: vi.fn(),
    };
});

vi.mock('express', () => {
    const expressApp = {
        use: vi.fn(),
        post: vi.fn(),
        get: vi.fn(),
    };
    const expressMock = vi.fn(() => expressApp) as any;
    expressMock.json = vi.fn();
    return {
        default: expressMock,
    };
});

vi.mock('cors', () => {
    return {
        default: vi.fn(),
    };
});

vi.mock('dotenv', () => {
    return {
        default: {
            config: vi.fn(),
        },
    };
});

vi.mock('socket.io', () => {
    return {
        Server: vi.fn(function() {
            return {
                on: vi.fn(),
                emit: vi.fn(),
            };
        }),
    };
});

vi.mock('node:http', () => {
    return {
        createServer: vi.fn(() => ({
            listen: vi.fn(),
        })),
    };
});

vi.mock('./models/response.model.js', () => {
    return {
        ResponseModel: {
            create: vi.fn(),
            findById: vi.fn(),
        }
    };
});

describe('server redis connection setup', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        delete process.env.REDIS_HOST;
        delete process.env.REDIS_PORT;
    });

    it('should use default values for connection if env vars are not set', async () => {
        delete process.env.REDIS_HOST;
        delete process.env.REDIS_PORT;

        const { connection } = await import('./server.js');

        expect(connection).toEqual({
            host: 'localhost',
            port: 6379,
        });

        const BullMQMock = await import('bullmq');
        expect(BullMQMock.Queue).toHaveBeenCalledWith('execution-queue', { connection: { host: 'localhost', port: 6379 } });
        expect(BullMQMock.QueueEvents).toHaveBeenCalledWith('execution-queue', { connection: { host: 'localhost', port: 6379 } });
    });

    it('should use environment variables for connection if set', async () => {
        process.env.REDIS_HOST = 'redis.example.com';
        process.env.REDIS_PORT = '6380';

        const { connection } = await import('./server.js');

        expect(connection).toEqual({
            host: 'redis.example.com',
            port: 6380,
        });

        const BullMQMock = await import('bullmq');
        expect(BullMQMock.Queue).toHaveBeenCalledWith('execution-queue', { connection: { host: 'redis.example.com', port: 6380 } });
        expect(BullMQMock.QueueEvents).toHaveBeenCalledWith('execution-queue', { connection: { host: 'redis.example.com', port: 6380 } });
    });
});
