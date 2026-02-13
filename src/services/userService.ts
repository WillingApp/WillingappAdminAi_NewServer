import { request } from './apiClient';
import { PaginationParams, ApiResponse } from './apiTypes';

export interface User {
    id: number;
    name: string | null;
    phone: string | null;
    countryId: number;
    languageId: number;
    statusId: number;
    imageUrl: string | null;
    creationTime: string;
    updateTime: string;
}

export interface UsersResponse extends ApiResponse<{
    items: User[];
    total: number;
}> { }

/**
 * Service for working with User related endpoints.
 */
class UserService {
    /**
     * Fetches users with pagination.
     * @param params { take, skip }
     * @returns { data: { items: User[], total: number } }
     */
    async getUsers(params: PaginationParams): Promise<UsersResponse> {
        const queryParams: Record<string, string> = {
            take: params.take.toString(),
            skip: params.skip.toString(),
            IncludeTotal: 'true',
            SortField: 'CreationTime',
            SortOrder: 'Descending',
        };
        //queryParams['Filter.StatusId'] = '3';

        if (params.Filter?.Search?.SearchTerm) {
            queryParams['Filter.Search.SearchTerm'] = params.Filter.Search.SearchTerm;
        }

        const query = new URLSearchParams(queryParams).toString();
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
