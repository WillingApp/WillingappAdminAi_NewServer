import { request } from './apiClient';
import { ApiEnvelope, ApiList, PaginationParams } from './apiTypes';
import { ApiError } from './apiTransport';

export interface PostImage {
    id: number;
    name: string | null;
    url: string;
}

export interface PostUser {
    id: number;
    name: string | null;
    phone: string | null;
}

export interface PostGroup {
    id: number;
    name: string;
    imageUrl: string | null;
}

interface PlaceName {
    languageId: number;
    name: string;
}

export interface Post {
    id: number;
    statusId: number;
    urgencyLevelId: number;
    categoryId: number;
    groupId: number | null;
    locationId: number;
    userId: number;
    contactTypeId: number;
    contactCountryId: number | null;
    contactName: string | null;
    contactPhone: string | null;
    content: string | null;
    duration: number | null;
    distance: number | null;
    expirationTime: string | null;
    isPublic: boolean;
    isActive: boolean;
    creationTime: string;
    updateTime: string | null;
    distanceFromLocation: number | null;
    place: {
        city: { names: PlaceName[] | null } | null;
        location: { latitude: number | null; longitude: number | null; names: PlaceName[] | null } | null;
    } | null;
    images: PostImage[];
    group: PostGroup | null;
    user: PostUser | null;
    groupName?: string | null;
}

export interface RequestsResponse extends ApiEnvelope<ApiList<Post>> { }
interface PostWire extends Omit<Post, 'images' | 'group' | 'user'> {
    images: PostImage[] | null;
    group?: PostGroup | null;
    user?: PostUser | null;
}
type PostListWireResponse = ApiEnvelope<(Omit<ApiList<PostWire>, 'items'> & { items: PostWire[] | null }) | null>;

function validPost(value: unknown): value is PostWire {
    if (!value || typeof value !== 'object') return false;
    const post = value as Partial<PostWire>;
    return typeof post.id === 'number' && Number.isFinite(post.id) &&
        typeof post.userId === 'number' && typeof post.statusId === 'number' &&
        typeof post.categoryId === 'number' && typeof post.urgencyLevelId === 'number' &&
        typeof post.creationTime === 'string' && typeof post.isActive === 'boolean' &&
        typeof post.isPublic === 'boolean' && (post.images == null || Array.isArray(post.images));
}

function normalizePost(post: PostWire): Post {
    return { ...post, images: Array.isArray(post.images) ? post.images.filter(image => image && typeof image.url === 'string') : [],
        group: post.group ?? null, user: post.user ?? null };
}

const requestService = {
    async getRequests(params: PaginationParams): Promise<RequestsResponse> {
        const query = new URLSearchParams({
            Take: String(params.take),
            Skip: String(params.skip),
            IncludeTotal: 'true',
        });
        const searchTerm = params.Filter?.Search?.SearchTerm?.trim();
        if (searchTerm) query.set('Filter.SearchTerm', searchTerm);

        const response = await request<PostListWireResponse>(`/Admin/Post?${query.toString()}`);
        const list = response?.data;
        if (response?.isSuccessful !== true || !list || !Number.isFinite(list.total) || list.total < 0 ||
            (!Array.isArray(list.items) && !(list.items === null && list.total === 0)) ||
            (Array.isArray(list.items) && !list.items.every(validPost))) {
            throw new ApiError('The server did not return a valid post list.');
        }
        return { ...response, data: { ...list, items: (list.items ?? []).map(normalizePost) } };
    },

    async getPost(postId: number): Promise<Post> {
        const response = await request<ApiEnvelope<PostWire | null>>(`/Admin/Post/${postId}`);
        if (response?.isSuccessful === true && response.data == null) {
            throw new ApiError(`The admin API listed post #${postId} but returned no details for it.`);
        }
        if (response?.isSuccessful !== true || !validPost(response.data) || response.data.id !== postId) {
            throw new ApiError('The server did not return valid post details.');
        }
        return normalizePost(response.data);
    },
};

export default requestService;
