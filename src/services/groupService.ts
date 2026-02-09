import { request, post, del } from './apiClient';
import { PaginationParams, ApiResponse, Group, CreateGroupPayload, AddUserPayload } from './apiTypes';
import topGroupsData from '../data/TopGroups.json';

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

export interface GroupsResponse extends ApiResponse<{
    items: Group[];
    total: number;
}> { }

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
            take: params.take.toString(),
            skip: params.skip.toString(),
            IncludeTotal: 'true',
        });

        if (params.Filter?.Search?.SearchTerm) {
            queryParams.append('Filter.Search.SearchTerm', params.Filter.Search.SearchTerm);
        }

        const endpoint = `/Group?${queryParams.toString()}`;
        return request<GroupsResponse>(endpoint);
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
