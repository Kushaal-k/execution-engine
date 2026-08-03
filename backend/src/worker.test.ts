import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('bullmq', () => {
    return {
        Worker: vi.fn(function() {
            return { on: vi.fn() };
        }),
    };
});

vi.mock('./execution.js', () => {
    return {
        default: vi.fn(),
    };
});

vi.mock('./server.js', () => {
    return {
        connection: {
            host: 'test-redis-host',
            port: 9999,
        },
    };
});

describe('worker redis connection setup', () => {
    beforeEach(() => {
        vi.resetModules();
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
