import { request } from './apiClient';
import { ApiEnvelope } from './apiTypes';
import { ApiError } from './apiTransport';

export interface MetadataItem {
    id: number;
    name: string;
}

export interface Metadata {
    categories: MetadataItem[];
    contactTypes: MetadataItem[];
    postStatuses: MetadataItem[];
    sortFields: MetadataItem[];
    sortOrders: MetadataItem[];
    statusCodes: MetadataItem[];
    urgencyLevels: MetadataItem[];
    userStatuses: MetadataItem[];
}

export interface MetadataResponse {
    isSuccessful: boolean;
    data: Metadata;
    statusMessage?: string;
}

export interface Country {
    id: number;
    phoneCode: string;
    iso2: string;
    iso3: string;
    isActive: boolean;
    names: { languageId: number; name: string }[];
}

class GeneralService {
    async getMetadata(): Promise<MetadataResponse> {
        return request<MetadataResponse>('/General/Metadata');
    }

    async getCountries(): Promise<Country[]> {
        const response = await request<ApiEnvelope<Country[]>>('/General/Country');
        if (response?.isSuccessful !== true || !Array.isArray(response.data)) {
            throw new ApiError('The server did not return countries.');
        }
        return response.data;
    }
}

const generalService = new GeneralService();
export default generalService;
