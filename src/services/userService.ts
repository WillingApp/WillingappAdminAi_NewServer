import { post, request } from './apiClient';
import { ApiEnvelope, ApiList, PaginationParams } from './apiTypes';
import { ApiError } from './apiTransport';

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

export interface UsersResponse extends ApiEnvelope<ApiList<User>> { }
type UsersWireResponse = ApiEnvelope<(Omit<ApiList<User>, 'items'> & { items: User[] | null }) | null>;

export interface UserListParams extends PaginationParams {
    statusId?: number;
}

export interface CreateUserPayload {
    countryId: number;
    phone: string;
}

function responseData<T>(response: ApiEnvelope<T>, message: string): T {
    if (response?.isSuccessful !== true || response.data == null) throw new ApiError(message);
    return response.data;
}

/**
 * Service for working with User related endpoints.
 */
class UserService {
    /**
     * Fetches users with pagination.
     * @param params { take, skip }
     * @returns { data: { items: User[], total: number } }
     */
    async getUsers(params: UserListParams): Promise<UsersResponse> {
        const queryParams: Record<string, string> = {
            take: params.take.toString(),
            skip: params.skip.toString(),
            IncludeTotal: 'true',
            SortField: 'CreationTime',
            SortOrder: 'Descending',
        };
        if (params.Filter?.Search?.SearchTerm) {
            queryParams['Filter.Search.SearchTerm'] = params.Filter.Search.SearchTerm;
        }
        if (params.statusId !== undefined) {
            queryParams['Filter.StatusId'] = String(params.statusId);
        }

        const query = new URLSearchParams(queryParams).toString();
        const response = await request<UsersWireResponse>(`/Admin/User?${query}`);
        const list = response?.data;
        if (response?.isSuccessful !== true || !list || typeof list.total !== 'number' ||
            (!Array.isArray(list.items) && !(list.items === null && list.total === 0))) {
            throw new ApiError('The server did not return a valid user list.');
        }
        return { ...response, data: { ...list, items: list.items ?? [] } };
    }

    async isPhoneAvailable(phone: string): Promise<boolean> {
        const response = await post<ApiEnvelope<boolean>>('/Admin/User/Phone/Available', { phone });
        return responseData(response, 'The server did not return phone availability.');
    }

    async createUser(payload: CreateUserPayload): Promise<void> {
        const response = await post<ApiEnvelope<boolean>>('/Admin/User', payload);
        if (responseData(response, 'The server did not confirm user creation.') !== true) {
            throw new ApiError('The server did not create the user.');
        }
    }

    async setBlocked(userId: number, isBlocked: boolean): Promise<User> {
        const response = await request<ApiEnvelope<User>>(`/Admin/User/${userId}/Block`, {
            method: 'PUT', body: JSON.stringify({ isBlocked }),
        });
        const user = responseData(response, 'The server did not confirm the user status change.');
        if (user.id !== userId || typeof user.statusId !== 'number' ||
            (isBlocked && user.statusId !== 2) || (!isBlocked && user.statusId === 2)) {
            throw new ApiError('The server returned invalid user data.');
        }
        return user;
    }

    /**
     * Sends a notification to a specific user.
     * This is a placeholder infrastructure.
     */
    async sendNotification(userId: number, message: string): Promise<void> {
        console.log(`[UserService] Sending notification to user ${userId}: ${message}`);
        // Simulate API call
        return new Promise((resolve) => setTimeout(resolve, 800));
    }

    /**
     * Sends a notification to all users.
     * This is a placeholder infrastructure.
     */
    async sendBroadcastNotification(message: string): Promise<void> {
        console.log(`[UserService] Sending broadcast notification: ${message}`);
        // Simulate API call
        return new Promise((resolve) => setTimeout(resolve, 1500));
    }

}

const userService = new UserService();
export default userService;
