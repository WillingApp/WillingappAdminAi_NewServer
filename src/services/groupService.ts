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

/**
 * Fetches the top groups data.
 * Currently fetches from a local JSON file to prepare for future API integration.
 */
export const fetchTopGroups = async (): Promise<TopGroup[]> => {
    // Simulate API network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    console.log('[GroupService] Fetching top groups data...');

    // In the future, this will be replaced by an actual API call:
    // const response = await apiClient.get('/groups/top');
    // return response.data.topGroups;

    return topGroupsData.topGroups as TopGroup[];
};
