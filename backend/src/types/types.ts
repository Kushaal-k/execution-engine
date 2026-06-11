export interface IInputCodeRequest {
    code: string,
    stdin?: string,
    language: string
}

export interface IExecutionResponse {
    status: status
    stdout: string,
    error: string,
    executionTime: number,
    memoryUsed: number,
    exitCode: number | null,
}

export type status = "Queued" | "Running" | "Completed" | "Failed";

export interface ModelSchema {
    code: String,
    stdin: String
    language: String,
    stdout: String,
    error: String,
    executionTime: Number
    memoryUsed: Number
    exitCode: Number
    status: status
}       