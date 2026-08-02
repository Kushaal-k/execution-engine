import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import executeCode from "./execution.js";
import { ResponseModel } from "./models/response.model.js";

const mockContainerRemove = vi.fn();
const mockContainerKill = vi.fn();
const mockContainerWait = vi.fn();
const mockContainerInspect = vi.fn();
const mockContainerStart = vi.fn();
const mockContainerAttach = vi.fn();

// Mock dependencies
vi.mock("dockerode", () => {
    return {
        default: class {
            getImage() {
                return { inspect: vi.fn().mockResolvedValue({}) };
            }
            createContainer() {
                return Promise.resolve({
                    start: mockContainerStart,
                    attach: mockContainerAttach,
                    kill: mockContainerKill,
                    wait: mockContainerWait,
                    inspect: mockContainerInspect,
                    remove: mockContainerRemove,
                });
            }
            modem = {
                demuxStream: vi.fn(),
            };
        }
    };
});

vi.mock("./models/response.model.js", () => {
    return {
        ResponseModel: {
            findById: vi.fn(),
            findByIdAndUpdate: vi.fn()
        }
    };
});

vi.mock("./db/config.js", () => {
    return {
        default: vi.fn().mockResolvedValue(true)
    }
});

describe("executeCode Error Handling", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default successful mock implementations
        mockContainerAttach.mockResolvedValue({
            on: vi.fn(),
            write: vi.fn(),
            end: vi.fn()
        });
        mockContainerStart.mockResolvedValue({});
        mockContainerWait.mockResolvedValue({ StatusCode: 0 });
        mockContainerInspect.mockResolvedValue({ State: { OOMKilled: false } });
        mockContainerRemove.mockResolvedValue({});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should log error but continue if container.remove() throws", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        // Mock the job
        const mockJobUpdateOne = vi.fn().mockResolvedValue({});
        vi.mocked(ResponseModel.findById).mockResolvedValue({
            code: "console.log('test')",
            language: "javascript",
            stdin: "",
            updateOne: mockJobUpdateOne
        } as any);

        // Make remove throw an error
        const removeError = new Error("Mock remove error");
        mockContainerRemove.mockRejectedValue(removeError);

        const result = await executeCode("test-job-id");

        expect(mockContainerRemove).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith("[execution engine] Failed to delete container ", removeError);

        // Ensure execution was considered successful despite remove failing
        expect(result.status).toBe("Completed");

        consoleErrorSpy.mockRestore();
    });

    it("should handle general execution errors and update job status", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        // Mock findById to throw an error
        const dbError = new Error("Database connection error");
        vi.mocked(ResponseModel.findById).mockRejectedValue(dbError);

        const result = await executeCode("test-job-id");

        expect(consoleErrorSpy).toHaveBeenCalledWith(`[execution engine] Job test-job-id failed:`, dbError);
        expect(ResponseModel.findByIdAndUpdate).toHaveBeenCalledWith("test-job-id", expect.objectContaining({
            $set: expect.objectContaining({
                status: "Failed",
                error: "Database connection error"
            })
        }));

        expect(result.status).toBe("Failed");
        expect(result.error).toBe("Database connection error");

        consoleErrorSpy.mockRestore();
    });
});
