import 'whatwg-fetch';
import authService, { SESSION_KEY } from './authService';
import groupService from './groupService';

const successful = data => ({ isSuccessful: true, statusCode: 0, data });
const reply = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

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

test('group list uses the administrator route and documented filters', async () => {
    const group = { id: 12, name: 'Test group', code: 'TEST', users: [] };
    fetch.mockResolvedValueOnce(reply(successful({ items: [group], skip: 10, limit: 10, total: 11 })));
    const result = await groupService.getGroups({ take: 10, skip: 10,
        Filter: { Search: { SearchTerm: 'test group' } } });

    expect(result.data.items).toEqual([group]);
    const [url, options] = fetch.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/Admin/Group');
    expect(parsed.searchParams.get('Take')).toBe('10');
    expect(parsed.searchParams.get('Skip')).toBe('10');
    expect(parsed.searchParams.get('IncludeTotal')).toBe('true');
    expect(parsed.searchParams.get('Filter.ActiveOnly')).toBe('false');
    expect(parsed.searchParams.getAll('Filter.Keywords')).toEqual(['test', 'group']);
    expect(options.headers.get('Authorization')).toBe('Bearer admin-token');
});

test('empty group list is distinct from a forbidden request', async () => {
    fetch.mockResolvedValueOnce(reply(successful({ items: null, skip: 0, limit: 10, total: 0 })));
    await expect(groupService.getGroups({ take: 10, skip: 0 })).resolves.toMatchObject({ data: { items: [], total: 0 } });

    fetch.mockResolvedValueOnce(reply(null, 403));
    await expect(groupService.getGroups({ take: 10, skip: 0 })).rejects.toThrow('HTTP 403');
});
