import { useState, useCallback } from 'react';
import { ApiResult } from '../services/apiTypes';

/**
 * A custom hook to manage API call states (data, error, loading).
 * This makes it easy to integrate service functions into UI components.
 */
export function useApi<T, Args extends any[]>(
    apiFunction: (...args: Args) => Promise<T>
) {
    const [state, setState] = useState<ApiResult<T>>({
        data: null,
        error: null,
        loading: false,
    });

    const execute = useCallback(
        async (...args: Args) => {
            setState({ data: null, error: null, loading: true });
            try {
                const result = await apiFunction(...args);
                setState({ data: result, error: null, loading: false });
                return result;
            } catch (err: any) {
                const errorMessage = err.message || 'Something went wrong';
                setState({ data: null, error: errorMessage, loading: false });
                throw err;
            }
        },
        [apiFunction]
    );

    return { ...state, execute };
}
