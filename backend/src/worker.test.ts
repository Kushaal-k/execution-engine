import { jest } from '@jest/globals';

jest.unstable_mockModule('bullmq', () => {
    return {
        Worker: jest.fn(() => ({
            on: jest.fn(),
        })),
    };
});

jest.unstable_mockModule('./execution.js', () => {
    return {
        default: jest.fn(),
    };
});

jest.unstable_mockModule('./server.js', () => {
    return {
        connection: {
            host: 'test-redis-host',
            port: 9999,
        },
    };
});

describe('worker redis connection setup', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    it('should initialize worker with the exported connection from server.ts', async () => {
        await import('./worker.js');
        const BullMQMock = await import('bullmq');

        expect(BullMQMock.Worker).toHaveBeenCalledWith(
            'execution-queue',
            expect.any(Function),
            {
                connection: {
                    host: 'test-redis-host',
                    port: 9999,
                },
            }
        );
    });
});
