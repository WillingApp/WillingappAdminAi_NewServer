import { request } from './apiClient';

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

class GeneralService {
    async getMetadata(): Promise<MetadataResponse> {
        return request<MetadataResponse>('/General/Metadata');
    }
}

const generalService = new GeneralService();
export default generalService;
