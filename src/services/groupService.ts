import { request, post, del } from './apiClient';
import { PaginationParams, ApiEnvelope, ApiList, Group, CreateGroupPayload, AddUserPayload } from './apiTypes';
import { ApiError } from './apiTransport';
import topGroupsData from '../data/TopGroupsMock.json';

export interface TopGroup {
    id: number;
    image: string;
    name: string;
    admin: string;
    usersCount: number;
    postsCount: number;
    weeklyTrendPercent: number;
}

export interface TopGroupsResponse {
    topGroups: TopGroup[];
}

export interface GroupsResponse extends ApiEnvelope<ApiList<Group>> { }
type GroupsWireResponse = ApiEnvelope<(Omit<ApiList<Group>, 'items'> & { items: Group[] | null }) | null>;

/**
 * Group service to handle group-related API calls
 */
const groupService = {
    /**
     * Fetches the top groups data (mocked for now)
     */
    fetchTopGroups: async (): Promise<TopGroup[]> => {
        // Simulate API network delay
        await new Promise((resolve) => setTimeout(resolve, 600));
        console.log('[GroupService] Fetching top groups data...');
        return topGroupsData.topGroups as TopGroup[];
    },

    /**
     * Fetches groups from the API with pagination and filtering
     */
    getGroups: async (params: PaginationParams): Promise<GroupsResponse> => {
        const queryParams = new URLSearchParams({
            Take: params.take.toString(),
            Skip: params.skip.toString(),
            IncludeTotal: 'true',
            'Filter.ActiveOnly': 'false',
        });

        const searchTerm = params.Filter?.Search?.SearchTerm?.trim();
        if (searchTerm) {
            searchTerm.split(/\s+/).forEach(keyword => queryParams.append('Filter.Keywords', keyword));
        }

        const response = await request<GroupsWireResponse>(`/Admin/Group?${queryParams.toString()}`);
        const list = response?.data;
        if (response?.isSuccessful !== true || !list || typeof list.total !== 'number' ||
            (!Array.isArray(list.items) && !(list.items === null && list.total === 0))) {
            throw new ApiError('The server did not return a valid group list.');
        }
        return { ...response, data: { ...list, items: (list.items ?? []).map(group => ({
            ...group, users: Array.isArray(group.users) ? group.users : [],
        })) } };
    },

    /**
     * Creates a new group
     */
    createGroup: async (data: CreateGroupPayload): Promise<Group> => {
        return post<Group>('/Group', data);
    },

    /**
     * Deletes a group
     */
    deleteGroup: async (groupId: number): Promise<void> => {
        return del<void>(`/Group/${groupId}`);
    },

    /**
     * Adds users to a group
     */
    addUsersToGroup: async (groupId: number, users: AddUserPayload[]): Promise<void> => {
        return post<void>(`/Group/${groupId}/Users`, {
            groupId,
            users
        });
    },

    /**
     * Removes a user from a group
     */
    removeUserFromGroup: async (groupId: number, userId: number): Promise<void> => {
        return del<void>(`/Group/${groupId}/User/${userId}`);
    }
};

export default groupService;
