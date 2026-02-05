import authService from './authService';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

/**
 * Handle HTTP error responses
 */
async function handleResponse(response: Response) {
    if (!response.ok) {
        let errorMessage = `HTTP Error: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
            // If response is not JSON
        }

        if (response.status === 401) {
            console.warn('Unauthorized: Token might be expired.');
            // Future: Trigger logout or token refresh
        }

        throw new Error(errorMessage);
    }
    return response.json();
}

/**
 * Common headers with Auth token
 */
const getHeaders = () => {
    const user = authService.getRememberedUser();
    const token = user?.token;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

/**
 * Centralized request function
 */
export async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const config = {
        ...options,
        headers: {
            ...getHeaders(),
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);
        return await handleResponse(response);
    } catch (error: any) {
        console.error('API Request Error:', error.message);
        throw error;
    }
}

/**
 * Guidance for adding other methods:
 * 
 * To add POST:
 * export async function post<T>(endpoint: string, data: any) {
 *   return request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) });
 * }
 * 
 * Similarity for PUT (method: 'PUT') and DELETE (method: 'DELETE').
 */
