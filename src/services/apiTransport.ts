import { ApiEnvelope } from './apiTypes';

export class ApiError extends Error {
    constructor(message: string, public statusCode?: number, public httpStatus?: number) {
        super(message);
        this.name = 'ApiError';
    }
}

// Independent of session storage so login can use the same transport.
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}, token?: string, notifyUnauthorized = true): Promise<T> {
    const baseUrl = process.env.REACT_APP_API_BASE_URL?.replace(/\/+$/, '');
    if (!baseUrl) throw new ApiError('The API URL is not configured.');
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(`${baseUrl}/${endpoint.replace(/^\/+/, '')}`, { ...options, headers });
    let body: (Partial<ApiEnvelope<unknown>> & { message?: string; error?: string }) | null = null;
    try {
        body = await response.json();
    } catch {
        if (response.ok && response.status !== 204) throw new ApiError('The server returned an invalid response.', undefined, response.status);
    }
    if (!response.ok || body?.isSuccessful === false) {
        const statusCode = body?.statusCode;
        if (notifyUnauthorized && (response.status === 401 || [1002, 1013, 1004, 1020].includes(statusCode ?? -1))) {
            window.dispatchEvent(new Event('unauthorized'));
        }
        throw new ApiError(body?.displayMessage || body?.statusMessage || body?.message || body?.error || `Request failed (HTTP ${response.status}).`, statusCode, response.status);
    }
    return body as T;
}
