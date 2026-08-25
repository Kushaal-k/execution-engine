import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import connectDB from "./config";

// Mock mongoose
vi.mock("mongoose", () => {
  return {
    default: {
      connect: vi.fn(),
    },
  };
});

describe("connectDB", () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Spy on console.log and console.error
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, "exit").mockImplementation((() => undefined) as any);

    // Save original environment
    originalEnv = { ...process.env };

    // Set a dummy MONGODB_URI for testing
    process.env.MONGODB_URI = "mongodb://localhost:27017/testdb";

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;

    // Restore spies
    vi.restoreAllMocks();
  });

  it("should connect to MongoDB and log success", async () => {
    // Setup the mock to resolve successfully
    vi.mocked(mongoose.connect).mockResolvedValueOnce({} as typeof mongoose);

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URI);
    expect(consoleLogSpy).toHaveBeenCalledWith("MongoDB connected successfully");
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it("should log an error message and exit if connection fails", async () => {
    const errorMsg = "Connection timed out";
    const error = new Error(errorMsg);

    // Setup the mock to reject with an Error
    vi.mocked(mongoose.connect).mockRejectedValueOnce(error);

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URI);
    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith("[execution engine] Database connection failed:", error);
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
