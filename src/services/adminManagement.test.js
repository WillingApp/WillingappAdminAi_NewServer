import 'whatwg-fetch';
import authService, { SESSION_KEY } from './authService';
import adminService from './adminService';
import userService from './userService';
import { request } from './apiClient';
import { apiRequest } from './apiTransport';

const successful = data => ({ isSuccessful: true, statusCode: 0, data });
const sessionData = () => ({ userId: 7, accessToken: 'test-access-token', accessTokenExpiration: new Date(Date.now() + 60000).toISOString(), refreshToken: 'test-refresh-token' });
const reply = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

beforeEach(() => {
    authService.clearSession();
    sessionStorage.clear();
    localStorage.clear();
    process.env.REACT_APP_API_BASE_URL = 'https://test-api.invalid/';
    global.fetch = jest.fn();
});
afterEach(() => { authService.clearSession(); jest.restoreAllMocks(); });

async function signIn(remember = false) {
    fetch.mockResolvedValueOnce(reply(successful(sessionData())));
    return authService.login('admin-test', 'test-password', remember);
}

test('login uses the administrator route and stores renewal tokens without the password', async () => {
    const session = await signIn();
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('https://test-api.invalid/Identity/Admin/Login');
    expect(JSON.parse(options.body)).toEqual({ username: 'admin-test', password: 'test-password' });
    expect(options.headers.has('Authorization')).toBe(false);
    expect(JSON.parse(sessionStorage.getItem(SESSION_KEY))).toEqual(session);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(sessionStorage.getItem(SESSION_KEY)).not.toMatch(/password/);
    expect(JSON.parse(sessionStorage.getItem(SESSION_KEY)).refreshToken).toBe('test-refresh-token');
    expect(authService.getRememberedUser()).toEqual(session);
});

test('remember me uses local storage and replaces a previous session', async () => {
    await signIn();
    const session = await signIn(true);
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(JSON.parse(localStorage.getItem(SESSION_KEY))).toEqual(session);
});

test.each([1003, 1004])('failed login with application code %s never authenticates or broadcasts a session expiry', async statusCode => {
    const listener = jest.fn();
    window.addEventListener('unauthorized', listener);
    fetch.mockResolvedValueOnce(reply({ isSuccessful: false, statusCode, displayMessage: 'Account cannot sign in.' }));
    await expect(authService.login('admin-test', 'wrong')).rejects.toThrow('Account cannot sign in.');
    expect(authService.getToken()).toBeUndefined();
    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener('unauthorized', listener);
});

test('expired, corrupt, and legacy mock sessions are discarded', () => {
    localStorage.setItem('willingapp_user', JSON.stringify({ token: 'legacy' }));
    localStorage.setItem('willingapp_admins', '[]');
    sessionStorage.setItem(SESSION_KEY, '{invalid');
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...sessionData(), refreshToken: undefined, username: 'admin-test', name: 'Test', accessTokenExpiration: '2000-01-01T00:00:00Z' }));
    expect(authService.getRememberedUser()).toBeNull();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
});

test('an expired legacy session without a refresh token requires sign-in', async () => {
    fetch.mockResolvedValueOnce(reply(successful({ ...sessionData(), refreshToken: undefined })));
    await authService.login('admin-test', 'test-password');
    const listener = jest.fn();
    window.addEventListener('unauthorized', listener);
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 120000);
    await expect(request('/Admin/AdminUser')).rejects.toThrow('Please sign in');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    window.removeEventListener('unauthorized', listener);
});

test('an expired remembered session renews on reopening and remains in local storage', async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...sessionData(), username: 'admin-test', name: 'Test', accessTokenExpiration: new Date(Date.now() - 1000).toISOString() }));
    const refreshed = { ...sessionData(), accessToken: 'renewed-access-token', refreshToken: 'rotated-refresh-token' };
    fetch.mockResolvedValueOnce(reply(successful(refreshed)));
    const restored = await authService.getSession();
    expect(restored.accessToken).toBe('renewed-access-token');
    expect(fetch.mock.calls[0][0]).toBe('https://test-api.invalid/Identity/Login/Refresh');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ accessToken: 'test-access-token', refreshToken: 'test-refresh-token' });
    expect(JSON.parse(localStorage.getItem(SESSION_KEY)).refreshToken).toBe('rotated-refresh-token');
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
});

test('concurrent requests share one renewal and use its new token', async () => {
    await signIn();
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 40000);
    fetch.mockResolvedValueOnce(reply(successful({ ...sessionData(), accessToken: 'renewed-access-token', refreshToken: 'rotated-refresh-token' })));
    fetch.mockResolvedValue(reply(successful({ items: [], total: 0 })));
    await Promise.all([adminService.getAdmins(), adminService.getAdmins()]);
    expect(fetch.mock.calls.filter(([url]) => url.includes('/Identity/Login/Refresh'))).toHaveLength(1);
    const reads = fetch.mock.calls.filter(([url]) => url.includes('/Admin/AdminUser'));
    expect(reads).toHaveLength(2);
    reads.forEach(([, options]) => expect(options.headers.get('Authorization')).toBe('Bearer renewed-access-token'));
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(JSON.parse(sessionStorage.getItem(SESSION_KEY)).refreshToken).toBe('rotated-refresh-token');
});

test('a server authentication failure renews and retries exactly once', async () => {
    await signIn();
    fetch.mockResolvedValueOnce(reply({ isSuccessful: false, statusCode: 1013 }, 401));
    fetch.mockResolvedValueOnce(reply(successful({ ...sessionData(), accessToken: 'renewed-access-token' })));
    fetch.mockResolvedValueOnce(reply(successful({ items: [], total: 0 })));
    await expect(adminService.getAdmins()).resolves.toMatchObject({ items: [] });
    expect(fetch).toHaveBeenCalledTimes(4);
    expect(fetch.mock.calls[3][1].headers.get('Authorization')).toBe('Bearer renewed-access-token');
});

test('a second authentication failure ends the session without a renewal loop', async () => {
    await signIn(true);
    fetch.mockResolvedValueOnce(reply({ isSuccessful: false, statusCode: 1013 }, 401));
    fetch.mockResolvedValueOnce(reply(successful({ ...sessionData(), accessToken: 'renewed-access-token' })));
    fetch.mockResolvedValueOnce(reply({ isSuccessful: false, statusCode: 1013 }, 401));
    await expect(adminService.getAdmins()).rejects.toMatchObject({ httpStatus: 401 });
    expect(fetch).toHaveBeenCalledTimes(4);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
});

test('a temporary renewal outage preserves Remember Me and permits a later retry', async () => {
    await signIn(true);
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 120000);
    fetch.mockRejectedValueOnce(new TypeError('Offline'));
    await expect(authService.getAccessToken()).rejects.toThrow('Offline');
    expect(localStorage.getItem(SESSION_KEY)).not.toBeNull();
    fetch.mockResolvedValueOnce(reply(successful({ ...sessionData(), accessToken: 'renewed-access-token' })));
    await expect(authService.getAccessToken()).resolves.toBe('renewed-access-token');
});

test('a rejected refresh token clears the remembered session', async () => {
    await signIn(true);
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 120000);
    fetch.mockResolvedValueOnce(reply({ isSuccessful: false, statusCode: 1002, displayMessage: 'Invalid refresh token.' }));
    await expect(authService.getAccessToken()).rejects.toThrow('Invalid refresh token.');
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(authService.getToken()).toBeUndefined();
});

test('logout during renewal cannot restore a cleared session', async () => {
    await signIn(true);
    let resolveRefresh;
    fetch.mockImplementationOnce(() => new Promise(resolve => { resolveRefresh = resolve; }));
    const renewing = authService.refreshSession();
    fetch.mockResolvedValueOnce(reply(successful(true)));
    await authService.logout();
    resolveRefresh(reply(successful({ ...sessionData(), accessToken: 'renewed-access-token' })));
    await expect(renewing).rejects.toThrow('Session changed');
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(authService.getToken()).toBeUndefined();
});

test('sign-out from another tab during renewal cannot recreate its remembered session', async () => {
    await signIn(true);
    let resolveRefresh;
    fetch.mockImplementationOnce(() => new Promise(resolve => { resolveRefresh = resolve; }));
    const renewing = authService.refreshSession();
    localStorage.removeItem(SESSION_KEY);
    authService.getRememberedUser();
    resolveRefresh(reply(successful({ ...sessionData(), accessToken: 'renewed-access-token' })));
    await expect(renewing).rejects.toThrow('Session changed');
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
});

test.each([1004, 1020])('disabled/locked account code %s signs out without refreshing', async statusCode => {
    await signIn(true);
    fetch.mockResolvedValueOnce(reply({ isSuccessful: false, statusCode, displayMessage: 'Account unavailable.' }));
    await expect(adminService.getAdmins()).rejects.toThrow('Account unavailable.');
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
});

test('logout clears the local session even if the backend is unavailable', async () => {
    await signIn(true);
    fetch.mockRejectedValueOnce(new Error('Offline'));
    const logout = authService.logout();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(authService.getToken()).toBeUndefined();
    await expect(logout).rejects.toThrow('Offline');
    expect(fetch.mock.calls[1][0]).toContain('/Identity/Logout');
    expect(fetch.mock.calls[1][1].headers.get('Authorization')).toBe('Bearer test-access-token');
});

test('admin listing sends pagination, search, an inactive filter, and bearer authorization', async () => {
    await signIn();
    fetch.mockResolvedValueOnce(reply(successful({ items: [], skip: 10, limit: 10, total: 0 })));
    await adminService.getAdmins({ skip: 10, take: 10, search: 'some name', isActive: false });
    const [url, options] = fetch.mock.calls[1];
    const params = new URL(url).searchParams;
    expect(params.get('Skip')).toBe('10');
    expect(params.get('Take')).toBe('10');
    expect(params.get('IncludeTotal')).toBe('true');
    expect(params.get('Filter.Search.SearchTerm')).toBe('some name');
    expect(params.get('Filter.IsActive')).toBe('false');
    expect(options.headers.get('Authorization')).toBe('Bearer test-access-token');
});

test('report administrator lookups load all pages, including server-limited pages', async () => {
    await signIn();
    fetch.mockResolvedValueOnce(reply(successful({ items: [{ id: 1 }], total: 2 })));
    fetch.mockResolvedValueOnce(reply(successful({ items: [{ id: 2 }], total: 2 })));
    expect(await adminService.getAllAdmins()).toEqual([{ id: 1 }, { id: 2 }]);
    expect(new URL(fetch.mock.calls[2][0]).searchParams.get('Skip')).toBe('1');
});

test('create and activation send the documented payloads', async () => {
    await signIn();
    const admin = { id: 8, name: 'Test Admin', username: 'admin-8', isActive: true };
    fetch.mockResolvedValueOnce(reply(successful(admin)));
    expect(await adminService.createAdmin({ name: admin.name, username: admin.username, password: 'test-password' })).toEqual(admin);
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ name: 'Test Admin', username: 'admin-8', password: 'test-password' });
    fetch.mockResolvedValueOnce(reply(successful({ ...admin, isActive: false })));
    await adminService.setActive(8, false);
    expect(fetch.mock.calls[2][0]).toContain('/Admin/AdminUser/8/IsActive');
    expect(fetch.mock.calls[2][1].method).toBe('PUT');
    expect(JSON.parse(fetch.mock.calls[2][1].body)).toEqual({ value: false });
});

test.each([1023, 1201])('permission/duplicate error %s is rejected without logging the administrator out', async statusCode => {
    await signIn();
    const listener = jest.fn();
    window.addEventListener('unauthorized', listener);
    fetch.mockResolvedValueOnce(reply({ isSuccessful: false, statusCode, displayMessage: 'Operation denied.' }));
    await expect(adminService.setActive(8, false)).rejects.toMatchObject({ statusCode });
    expect(listener).not.toHaveBeenCalled();
    expect(authService.getToken()).toBe('test-access-token');
    window.removeEventListener('unauthorized', listener);
});

test.each([401, 1013])('HTTP/application authentication failure %s settles and broadcasts unauthorized', async code => {
    const listener = jest.fn();
    window.addEventListener('unauthorized', listener);
    fetch.mockResolvedValueOnce(reply({ isSuccessful: false, statusCode: code, statusMessage: 'Session expired.' }, code === 401 ? 401 : 200));
    await expect(apiRequest('/Admin/AdminUser')).rejects.toThrow('Session expired.');
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener('unauthorized', listener);
});

test('the API client does not send anonymous management requests', async () => {
    await expect(adminService.getAdmins()).rejects.toThrow('Please sign in');
    expect(fetch).not.toHaveBeenCalled();
});

test('a malformed success response cannot become a successful administrator mutation', async () => {
    await signIn();
    fetch.mockResolvedValueOnce(reply({ isSuccessful: true, statusCode: 0, data: null }));
    await expect(adminService.createAdmin({ name: 'Test', username: 'test', password: 'test-password' })).rejects.toThrow('valid administrator data');
});


test('an administrator loads app users through the admin route rather than the forbidden regular-user route', async () => {
    await signIn();
    fetch.mockResolvedValueOnce(reply(successful({ items: [], skip: 0, limit: 10, total: 0 })));
    await userService.getUsers({ take: 10, skip: 0 });
    const [url, options] = fetch.mock.calls[1];
    expect(new URL(url).pathname).toBe('/Admin/User');
    expect(new URL(url).searchParams.get('SortField')).toBe('CreationTime');
    expect(options.headers.get('Authorization')).toBe('Bearer test-access-token');
});
