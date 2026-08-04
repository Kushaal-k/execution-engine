/**
 * Execution Engine Types
 * Shared between Frontend, Backend API, and Worker Processes
 */

export type ExecutionStatus = "Queued" | "Running" | "Completed" | "Failed";

export type SupportedLanguage = "python" | "cpp" | "javascript" | "java" | "c";

export interface IExecutionRequest {
    code: string;
    stdin?: string;
    language: SupportedLanguage | string;
    timeLimitMs?: number;
    memoryLimitMb?: number;
}

// Backwards compatibility alias
export type IInputCodeRequest = IExecutionRequest;

export interface IExecutionResponse {
    jobId?: string;
    status: ExecutionStatus;
    stdout: string;
    error: string;
    executionTime: number;
    memoryUsed: number;
    exitCode: number | null;
}

export interface ModelSchema {
    code: string;
    stdin: string;
    language: string;
    stdout: string;
    error: string;
    executionTime: number;
    memoryUsed: number;
    exitCode: number;
    status: ExecutionStatus;
}
