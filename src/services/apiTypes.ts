/**
 * Common API Types and Interfaces
 */

export interface PaginationParams {
    take: number;
    skip: number;
    Filter?: {
        Search?: {
            SearchTerm?: string;
        };
    };
}

export interface ApiResponse<T> {
    data: T;
    total: number;
    error?: string;
}

export interface ApiResult<T> {
    data: T | null;
    total?: number;
    error: string | null;
    loading: boolean;
}

export interface ApiErrorResponse {
    message?: string;
    error?: string;
    statusCode?: number;
}

export interface GroupUser {
    userId: number;
    countryId: number | null;
    name: string | null;
    phone: string | null;
    imageUrl: string | null;
    isAdmin: boolean;
}

export interface Group {
    id: number;
    code: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    linkUrl: string | null;
    isOpenForAll: boolean;
    canAddPosts: boolean;
    users: GroupUser[];
}

export interface CreateGroupPayload {
    name: string;
    description: string;
    imageFileKey: string;
    linkUrl: string;
    isOpenForAll: boolean;
}

export interface AddUserPayload {
    userId: number;
    phone: string;
    isAdmin: boolean;
}
