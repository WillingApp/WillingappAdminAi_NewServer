import { request } from './apiClient';
import { PaginationParams, ApiResponse } from './apiTypes';

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface UsersResponse extends ApiResponse<User[]> { }

/**
 * Service for working with User related endpoints.
 */
class UserService {
    /**
     * Fetches users with pagination.
     * @param params { take, skip }
     * @returns { data: User[], total: number, error?: string }
     */
    async getUsers(params: PaginationParams): Promise<UsersResponse> {
        const query = new URLSearchParams({
            Take: params.take.toString(),
            Skip: params.skip.toString(),
        }).toString();

        // Assuming the API returns the structure { data: User[], total: number }
        // If the API returns a flat array, we would need to adjust this logic.
        return request<UsersResponse>(`/User?${query}`);
    }

    /**
     * Guidance for extending:
     * 
     * To add Create User (POST):
     * async createUser(user: Partial<User>): Promise<User> {
     *   return request<User>('/User', {
     *     method: 'POST',
     *     body: JSON.stringify(user)
     *   });
     * }
     * 
     * To add Update User (PUT):
     * async updateUser(id: string, updates: Partial<User>): Promise<User> {
     *   return request<User>(`/User/${id}`, {
     *     method: 'PUT',
     *     body: JSON.stringify(updates)
     *   });
     * }
     */
}

const userService = new UserService();
export default userService;
