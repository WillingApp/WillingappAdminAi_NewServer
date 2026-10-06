import { ApiEnvelope } from './apiTypes';
import { ApiError, apiRequest } from './apiTransport';

export interface AdminSession {
    userId: number;
    username: string;
    name: string;
    accessToken: string;
    accessTokenExpiration: string;
    refreshToken?: string;
}

interface AuthData {
    userId: number;
    accessToken: string;
    accessTokenExpiration: string;
    refreshToken?: string;
}

export const SESSION_KEY = 'willingapp_admin_session_v1';
export const SESSION_CHANGED_EVENT = 'admin-session-changed';
export const REFRESH_BEFORE_EXPIRY_MS = 30000;

function isSession(value: unknown): value is AdminSession {
    if (!value || typeof value !== 'object') return false;
    const session = value as Partial<AdminSession>;
    return typeof session.userId === 'number' && session.userId > 0 &&
        typeof session.username === 'string' && !!session.username && typeof session.name === 'string' &&
        typeof session.accessToken === 'string' && !!session.accessToken &&
        typeof session.accessTokenExpiration === 'string' && Number.isFinite(Date.parse(session.accessTokenExpiration)) &&
        (session.refreshToken === undefined || (typeof session.refreshToken === 'string' && !!session.refreshToken));
}

const isUnexpired = (session: AdminSession) => Date.parse(session.accessTokenExpiration) > Date.now();

class AuthService {
    private currentUser: AdminSession | null = null;
    private storage: Storage = sessionStorage;
    private refreshing: Promise<AdminSession> | null = null;
    private generation = 0;

    private saveSession(session: AdminSession) {
        this.storage.setItem(SESSION_KEY, JSON.stringify(session));
        this.currentUser = session;
        window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
    }

    async login(username: string, password: string, remember = false): Promise<AdminSession> {
        const response = await apiRequest<ApiEnvelope<AuthData>>('/Identity/Admin/Login', {
            method: 'POST', body: JSON.stringify({ username: username.trim(), password }),
        }, undefined, false);
        const auth = response.data;
        const session: AdminSession = {
            userId: auth?.userId, username: username.trim(), name: username.trim(),
            accessToken: auth?.accessToken, accessTokenExpiration: auth?.accessTokenExpiration,
            ...(auth?.refreshToken ? { refreshToken: auth.refreshToken } : {}),
        };
        if (response.isSuccessful !== true || !isSession(session) || !isUnexpired(session)) {
            throw new ApiError('The server did not return a valid administrator session.');
        }
        this.clearSession();
        this.storage = remember ? localStorage : sessionStorage;
        this.saveSession(session);
        return session;
    }

    getRememberedUser(): AdminSession | null {
        const previous = this.currentUser;
        localStorage.removeItem('willingapp_user');
        localStorage.removeItem('willingapp_admins');
        for (const storage of [sessionStorage, localStorage]) {
            const raw = storage.getItem(SESSION_KEY);
            if (!raw) continue;
            try {
                const value: unknown = JSON.parse(raw);
                // An expired access token can still be restored through its refresh token.
                if (isSession(value) && (isUnexpired(value) || value.refreshToken)) {
                    if (previous && previous.userId !== value.userId) this.generation += 1;
                    this.storage = storage;
                    this.currentUser = value;
                    return value;
                }
            } catch { /* Discard corrupt or obsolete session data. */ }
            storage.removeItem(SESSION_KEY);
        }
        if (previous) this.generation += 1;
        this.currentUser = null;
        return null;
    }

    getToken(): string | undefined {
        const session = this.currentUser || this.getRememberedUser();
        return session && isUnexpired(session) ? session.accessToken : undefined;
    }

    async getSession(): Promise<AdminSession | null> {
        const session = this.currentUser || this.getRememberedUser();
        if (!session) return null;
        if (session.refreshToken && Date.parse(session.accessTokenExpiration) - Date.now() <= REFRESH_BEFORE_EXPIRY_MS) {
            return this.refreshSession();
        }
        if (!isUnexpired(session)) {
            this.invalidateSession(session.accessToken);
            return null;
        }
        return session;
    }

    async getAccessToken(): Promise<string> {
        const session = await this.getSession();
        if (!session) throw new ApiError('Please sign in to continue.', 1002, 401);
        return session.accessToken;
    }

    async refreshSession(rejectedToken?: string): Promise<AdminSession> {
        if (this.refreshing) return this.refreshing;
        const session = this.currentUser || this.getRememberedUser();
        if (!session?.refreshToken) {
            if (session) this.invalidateSession(session.accessToken);
            throw new ApiError('Please sign in again to renew your session.', 1002, 401);
        }
        if (rejectedToken && rejectedToken !== session.accessToken && isUnexpired(session)) return session;
        const generation = this.generation;
        const refresh = async () => {
            if (generation !== this.generation) throw new ApiError('Session changed. Please sign in again.', 1002, 401);
            // Another remembered tab may already have rotated the refresh token while we waited.
            const latest = this.getRememberedUser();
            if (!latest || latest.userId !== session.userId) throw new ApiError('Please sign in again.', 1002, 401);
            if (latest.accessToken !== session.accessToken && isUnexpired(latest)) return latest;
            try {
                const response = await apiRequest<ApiEnvelope<AuthData>>('/Identity/Login/Refresh', {
                    method: 'POST', body: JSON.stringify({ accessToken: latest.accessToken, refreshToken: latest.refreshToken }),
                }, undefined, false);
                const auth = response.data;
                const renewed: AdminSession = {
                    ...latest, userId: auth?.userId, accessToken: auth?.accessToken,
                    accessTokenExpiration: auth?.accessTokenExpiration,
                    refreshToken: auth?.refreshToken || latest.refreshToken,
                };
                if (response.isSuccessful !== true || !isSession(renewed) || !isUnexpired(renewed) || renewed.userId !== latest.userId) {
                    throw new ApiError('The server could not renew your administrator session.', 1002, 401);
                }
                if (generation !== this.generation) throw new ApiError('Session changed. Please sign in again.', 1002, 401);
                this.saveSession(renewed);
                return renewed;
            } catch (error) {
                // Offline/5xx failures preserve the saved session so renewal can be retried.
                if (error instanceof ApiError && ((error.httpStatus && error.httpStatus >= 400 && error.httpStatus < 500) || (error.statusCode !== undefined && error.statusCode !== 0))) {
                    if (generation === this.generation) this.invalidateSession(latest.accessToken);
                }
                throw error;
            }
        };
        // Web Locks serialize refresh-token rotation across tabs on the same origin.
        const refreshWithLock = async () => navigator.locks.request(`${SESSION_KEY}_refresh`, refresh);
        const pending = this.storage === localStorage && navigator.locks
            ? refreshWithLock()
            : refresh();
        this.refreshing = pending;
        try {
            return await pending;
        } finally {
            if (this.refreshing === pending) this.refreshing = null;
        }
    }

    invalidateSession(token?: string) {
        if (token && this.currentUser?.accessToken !== token) return;
        this.clearSession();
        window.dispatchEvent(new Event('unauthorized'));
    }

    clearSession() {
        this.generation += 1;
        this.currentUser = null;
        this.refreshing = null;
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem('willingapp_user');
        localStorage.removeItem('willingapp_admins');
    }

    async logout(): Promise<void> {
        const token = this.currentUser?.accessToken;
        this.clearSession();
        if (token) await apiRequest('/Identity/Logout', { method: 'POST' }, token, false);
    }
}

const authService = new AuthService();
export default authService;
