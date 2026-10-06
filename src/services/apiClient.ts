import authService from './authService';
import { ApiError, apiRequest } from './apiTransport';

const isAuthenticationError = (error: unknown): error is ApiError => error instanceof ApiError &&
    (error.httpStatus === 401 || [1002, 1013, 1004, 1020].includes(error.statusCode ?? -1));

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await authService.getAccessToken();
    try {
        return await apiRequest<T>(endpoint, options, token, false);
    } catch (error) {
        if (!isAuthenticationError(error)) throw error;
        if ([1004, 1020].includes(error.statusCode ?? -1)) {
            authService.invalidateSession(token);
            throw error;
        }
        const renewed = await authService.refreshSession(token);
        // Retry once after renewal; an unsuccessful retry must settle normally.
        try {
            return await apiRequest<T>(endpoint, options, renewed.accessToken, false);
        } catch (retryError) {
            if (isAuthenticationError(retryError)) authService.invalidateSession(renewed.accessToken);
            throw retryError;
        }
    }
}

export async function post<T>(endpoint: string, data: unknown): Promise<T> {
    return request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) });
}

export async function del<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE' });
}
