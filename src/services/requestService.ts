import { request } from './apiClient';
import { PaginationParams, ApiResponse } from './apiTypes';

export interface Post {
    id: number;
    statusId: number;
    urgencyLevelId: number;
    categoryId: number;
    groupId: number | null;
    locationId: number;
    userId: number;
    contactTypeId: number;
    contactName: string | null;
    contactPhone: string | null;
    content: string;
    duration: number;
    distance: number | null;
    expirationTime: string;
    isActive: boolean;
    creationTime: string;
    updateTime: string;
    distanceFromLocation: number;
    place: {
        city: {
            id: number;
            countryId: number;
            externalId: string;
            names: {
                languageId: number;
                name: string;
            }[];
        };
        location: {
            id: number;
            latitude: number;
            longitude: number;
            names: {
                languageId: number;
                name: string;
            }[];
        };
    };
    images: any[];
    [key: string]: any;
}

export interface RequestsResponse extends ApiResponse<{
    items: Post[];
    total: number;
}> { }

/**
 * Service for working with Post/Request related endpoints.
 */
class RequestService {
    /**
     * Fetches requests (posts) with pagination, filtering and sorting.
     * @param params { take, skip, Filter }
     * @returns { data: { items: Post[], total: number } }
     */
    async getRequests(params: PaginationParams): Promise<RequestsResponse> {
        const queryParams: Record<string, string> = {
            take: params.take.toString(),
            skip: params.skip.toString(),
            'Filter.LanguageId': '1',
            'Filter.ActiveOnly': 'true',
            SortField: 'timestamp',
            SortOrder: '2',
            IncludeTotal: 'true',
        };

        if (params.Filter?.Search?.SearchTerm) {
            queryParams['Filter.Search.SearchTerm'] = params.Filter.Search.SearchTerm;
        }

        const query = new URLSearchParams(queryParams).toString();
        return request<RequestsResponse>(`/Post?${query}`);
    }
}

const requestService = new RequestService();
export default requestService;
