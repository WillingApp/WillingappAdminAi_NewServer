import 'whatwg-fetch';
import authService, { SESSION_KEY } from './authService';
import userService from './userService';
import generalService from './generalService';

const successful = data => ({ isSuccessful: true, statusCode: 0, data });
const reply = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const user = { id: 19, name: null, phone: '0501234567', countryId: 91, languageId: 1, statusId: 1, imageUrl: null,
    creationTime: '2026-10-01T00:00:00Z', updateTime: '2026-10-01T00:00:00Z' };

beforeEach(() => {
    authService.clearSession();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId: 7, username: 'admin', name: 'Admin', accessToken: 'admin-token',
        accessTokenExpiration: new Date(Date.now() + 60000).toISOString() }));
    process.env.REACT_APP_API_BASE_URL = 'https://test-api.invalid';
    global.fetch = jest.fn();
});
afterEach(() => authService.clearSession());

test('user list sends search, status and pagination to the admin route', async () => {
    fetch.mockResolvedValueOnce(reply(successful({ items: [user], skip: 10, limit: 10, total: 11 })));
    const result = await userService.getUsers({ take: 10, skip: 10, statusId: 2,
        Filter: { Search: { SearchTerm: '050' } } });
    expect(result.data.items).toEqual([user]);
    const [url, options] = fetch.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/Admin/User');
    expect(parsed.searchParams.get('Filter.Search.SearchTerm')).toBe('050');
    expect(parsed.searchParams.get('Filter.StatusId')).toBe('2');
    expect(parsed.searchParams.get('take')).toBe('10');
    expect(parsed.searchParams.get('skip')).toBe('10');
    expect(options.headers.get('Authorization')).toBe('Bearer admin-token');
});

test('normalizes the production empty-list response', async () => {
    fetch.mockResolvedValueOnce(reply(successful({ items: null, skip: 0, limit: 10, total: 0 })));
    await expect(userService.getUsers({ take: 10, skip: 0,
        Filter: { Search: { SearchTerm: 'no match' } } })).resolves.toMatchObject({ data: { items: [], total: 0 } });
});

test('country lookup uses the authenticated General/Country route', async () => {
    const countries = [{ id: 91, iso2: 'IL', phoneCode: '+972', isActive: true,
        names: [{ languageId: 1, name: 'ישראל' }] }];
    fetch.mockResolvedValueOnce(reply(successful(countries)));
    await expect(generalService.getCountries()).resolves.toEqual(countries);
    expect(fetch.mock.calls[0][0]).toBe('https://test-api.invalid/General/Country');
    expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer admin-token');
});

test.each([false, true])('phone availability returns the backend boolean %s', async available => {
    fetch.mockResolvedValueOnce(reply(successful(available)));
    await expect(userService.isPhoneAvailable('0501234567')).resolves.toBe(available);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('https://test-api.invalid/Admin/User/Phone/Available');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ phone: '0501234567' });
});

test('creation sends only countryId and phone and requires true confirmation', async () => {
    fetch.mockResolvedValueOnce(reply(successful(true)));
    await userService.createUser({ countryId: 91, phone: '0501234567' });
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('https://test-api.invalid/Admin/User');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ countryId: 91, phone: '0501234567' });
    fetch.mockResolvedValueOnce(reply(successful(false)));
    await expect(userService.createUser({ countryId: 91, phone: '0501234567' })).rejects.toThrow('did not create');
});

test.each([[true, 2], [false, 1]])('block mutation sends isBlocked=%s and validates its returned user', async (isBlocked, statusId) => {
    fetch.mockResolvedValueOnce(reply(successful({ ...user, statusId })));
    await expect(userService.setBlocked(user.id, isBlocked)).resolves.toMatchObject({ id: user.id, statusId });
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('https://test-api.invalid/Admin/User/19/Block');
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body)).toEqual({ isBlocked });
});

test('block mutation rejects a successful envelope with an unchanged blocked state', async () => {
    fetch.mockResolvedValueOnce(reply(successful({ ...user, statusId: 1 })));
    await expect(userService.setBlocked(user.id, true)).rejects.toThrow('invalid user data');
});

test('backend failures and malformed successes do not become successful user actions', async () => {
    fetch.mockResolvedValueOnce(reply({ isSuccessful: false, statusCode: 1201, displayMessage: 'Phone already exists.' }));
    await expect(userService.createUser({ countryId: 91, phone: '0501234567' })).rejects.toThrow('Phone already exists.');
    fetch.mockResolvedValueOnce(reply(successful(null)));
    await expect(userService.isPhoneAvailable('0501234567')).rejects.toThrow('availability');
    fetch.mockResolvedValueOnce(reply(successful(null)));
    await expect(userService.setBlocked(19, true)).rejects.toThrow('status change');
    fetch.mockResolvedValueOnce(reply(successful(null)));
    await expect(generalService.getCountries()).rejects.toThrow('countries');
    fetch.mockResolvedValueOnce(reply(successful(null)));
    await expect(userService.getUsers({ take: 10, skip: 0 })).rejects.toThrow('valid user list');
});
