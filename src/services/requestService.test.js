import 'whatwg-fetch';
import authService, { SESSION_KEY } from './authService';
import requestService from './requestService';

const successful = data => ({ isSuccessful: true, statusCode: 0, data });
const reply = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const post = { id: 12, userId: 8, statusId: 2, categoryId: 3, urgencyLevelId: 1,
    creationTime: '2026-10-01T00:00:00Z', isActive: false, isPublic: true,
    images: null, group: null, user: null };

beforeEach(() => {
    authService.clearSession();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        userId: 7, username: 'admin', name: 'Admin', accessToken: 'admin-token',
        accessTokenExpiration: new Date(Date.now() + 60000).toISOString(),
    }));
    process.env.REACT_APP_API_BASE_URL = 'https://test-api.invalid';
    global.fetch = jest.fn();
});

afterEach(() => authService.clearSession());

test('admin list includes inactive posts and uses only supported filters', async () => {
    fetch.mockResolvedValueOnce(reply(successful({ items: [post], skip: 10, limit: 10, total: 11 })));
    const result = await requestService.getRequests({ take: 10, skip: 10,
        Filter: { Search: { SearchTerm: '  needed help  ' } } });

    expect(result.data.items[0]).toMatchObject({ id: 12, isActive: false, images: [] });
    const [url, options] = fetch.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/Admin/Post');
    expect(Object.fromEntries(parsed.searchParams)).toEqual({
        Take: '10', Skip: '10', IncludeTotal: 'true', 'Filter.SearchTerm': 'needed help',
    });
    expect(options.headers.get('Authorization')).toBe('Bearer admin-token');
});

test('empty list is valid but malformed and failed responses are errors', async () => {
    fetch.mockResolvedValueOnce(reply(successful({ items: null, skip: 0, limit: 10, total: 0 })));
    await expect(requestService.getRequests({ take: 10, skip: 0 })).resolves.toMatchObject({
        data: { items: [], total: 0 },
    });

    fetch.mockResolvedValueOnce(reply(successful({ items: null, total: 4 })));
    await expect(requestService.getRequests({ take: 10, skip: 0 })).rejects.toThrow('valid post list');
    fetch.mockResolvedValueOnce(reply(successful({ items: [post] })));
    await expect(requestService.getRequests({ take: 10, skip: 0 })).rejects.toThrow('valid post list');
    fetch.mockResolvedValueOnce(reply(successful({ items: [{ ...post, categoryId: undefined }], total: 1 })));
    await expect(requestService.getRequests({ take: 10, skip: 0 })).rejects.toThrow('valid post list');
    fetch.mockResolvedValueOnce(reply(null, 404));
    await expect(requestService.getRequests({ take: 10, skip: 0 })).rejects.toThrow('HTTP 404');
    expect(fetch.mock.calls.every(([url]) => new URL(url).pathname === '/Admin/Post')).toBe(true);
});

test('detail uses the administrator route and validates the requested post', async () => {
    fetch.mockResolvedValueOnce(reply(successful({ ...post, images: [{ id: 3, name: 'Image', url: 'https://example.invalid/image.jpg' }] })));
    await expect(requestService.getPost(12)).resolves.toMatchObject({ id: 12, images: [{ id: 3 }] });
    expect(new URL(fetch.mock.calls[0][0]).pathname).toBe('/Admin/Post/12');

    fetch.mockResolvedValueOnce(reply(successful({ ...post, id: 13 })));
    await expect(requestService.getPost(12)).rejects.toThrow('valid post details');
    fetch.mockResolvedValueOnce(reply(successful(null)));
    await expect(requestService.getPost(12)).rejects.toThrow('listed post #12 but returned no details');
});
