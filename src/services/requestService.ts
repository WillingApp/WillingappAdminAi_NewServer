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

    /**
     * Updates the status of a request.
     * @param id The ID of the request (post)
     * @param statusId The new status ID
     */
    async updateRequestStatus(id: number, statusId: number): Promise<void> {
        return request<void>(`/Post/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ statusId }),
        });
    }

    /**
     * Deletes a request by changing its status to a "deleted" state.
     * Assuming statusId 4 represents "Deleted".
     * @param id The ID of the request
     */
    async deleteRequest(id: number): Promise<void> {
        return this.updateRequestStatus(id, 4);
    }
}

const requestService = new RequestService();
export default requestService;
