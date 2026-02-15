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

export interface ReportInfo {
    id: number;
    creationTime: string;
    updateTime: string;
    status: number; // 1 = Open, 2 = Deleted, 3 = Approved
    description: string;
    handledByAdminId: number | null;
}

export interface ReportUser {
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

export interface ReportRequest {
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
}

export interface Report {
    id: number;
    report: ReportInfo;
    reporter: ReportUser;
    reportedUser: ReportUser;
    request: ReportRequest;
    admin?: any; // Embedded admin object found in some mock data
}
