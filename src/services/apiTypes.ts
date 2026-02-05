/**
 * Common API Types and Interfaces
 */

export interface PaginationParams {
    take: number;
    skip: number;
}

export interface ApiResponse<T> {
    data: T;
    total: number;
    error?: string;
}

export interface ApiResult<T> {
    data: T | null;
    total?: number;
    error: string | null;
    loading: boolean;
}

export interface ApiErrorResponse {
    message?: string;
    error?: string;
    statusCode?: number;
}
