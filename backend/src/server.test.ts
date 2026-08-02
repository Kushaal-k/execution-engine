import { jest } from '@jest/globals';

// Mock dependencies
jest.unstable_mockModule('bullmq', () => {
    return {
        Queue: jest.fn(() => ({
            add: jest.fn(),
        })),
        QueueEvents: jest.fn(() => ({
            on: jest.fn(),
        })),
    };
});

jest.unstable_mockModule('./db/config.js', () => {
    return {
        default: jest.fn(),
    };
});

jest.unstable_mockModule('express', () => {
    const expressApp = {
        use: jest.fn(),
        post: jest.fn(),
        get: jest.fn(),
    };
    const expressMock = jest.fn(() => expressApp) as any;
    expressMock.json = jest.fn();
    return {
        default: expressMock,
    };
});

jest.unstable_mockModule('cors', () => {
    return {
        default: jest.fn(),
    };
});

jest.unstable_mockModule('dotenv', () => {
    return {
        default: {
            config: jest.fn(),
        },
    };
});

jest.unstable_mockModule('socket.io', () => {
    return {
        Server: jest.fn(() => ({
            on: jest.fn(),
            emit: jest.fn(),
        })),
    };
});

jest.unstable_mockModule('node:http', () => {
    return {
        createServer: jest.fn(() => ({
            listen: jest.fn(),
        })),
    };
});

jest.unstable_mockModule('./models/response.model.js', () => {
    return {
        ResponseModel: {
            create: jest.fn(),
            findById: jest.fn(),
        }
    };
});

describe('server redis connection setup', () => {
    beforeEach(() => {
        jest.resetModules();
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
