import { post, request } from './apiClient';
import { ApiEnvelope, ApiList } from './apiTypes';
import { ApiError } from './apiTransport';

export interface AdminUser {
    id: number;
    name: string;
    username: string;
    isActive: boolean;
}

export interface CreateAdminPayload {
    name: string;
    username: string;
    password: string;
}

interface AdminListParams {
    take?: number;
    skip?: number;
    search?: string;
    isActive?: boolean;
    signal?: AbortSignal;
}

function responseData<T>(response: ApiEnvelope<T>): T {
    if (response?.isSuccessful !== true || response.data == null) {
        throw new ApiError('The server did not return valid administrator data.');
    }
    return response.data;
}

class AdminService {
    async getAdmins({ take = 10, skip = 0, search, isActive, signal }: AdminListParams = {}): Promise<ApiList<AdminUser>> {
        const query = new URLSearchParams({ Take: String(take), Skip: String(skip), IncludeTotal: 'true' });
        if (search) query.set('Filter.Search.SearchTerm', search);
        if (isActive !== undefined) query.set('Filter.IsActive', String(isActive));
        const response = await request<ApiEnvelope<ApiList<AdminUser>>>(`/Admin/AdminUser?${query}`, { signal });
        return responseData(response);
    }

    async getAllAdmins(signal?: AbortSignal): Promise<AdminUser[]> {
        const admins: AdminUser[] = [];
        let page: ApiList<AdminUser>;
        do {
            page = await this.getAdmins({ take: 50, skip: admins.length, signal });
            admins.push(...page.items);
        } while (page.items.length > 0 && admins.length < page.total);
        return admins;
    }

    async createAdmin(payload: CreateAdminPayload): Promise<AdminUser> {
        const response = await post<ApiEnvelope<AdminUser>>('/Admin/AdminUser', payload);
        return responseData(response);
    }

    async setActive(id: number, value: boolean): Promise<AdminUser> {
        const response = await request<ApiEnvelope<AdminUser>>(`/Admin/AdminUser/${id}/IsActive`, {
            method: 'PUT', body: JSON.stringify({ value }),
        });
        return responseData(response);
    }
}

const adminService = new AdminService();
export default adminService;
