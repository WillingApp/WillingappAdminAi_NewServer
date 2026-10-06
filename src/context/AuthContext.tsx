import React, { createContext, useContext, useState, useEffect } from 'react';
import authService, { AdminSession, REFRESH_BEFORE_EXPIRY_MS, SESSION_CHANGED_EVENT, SESSION_KEY } from '../services/authService';
import { notifications } from '@mantine/notifications';

interface AuthContextType {
    user: AdminSession | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string, remember: boolean) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AdminSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        void authService.getSession().then(session => {
            if (mounted) setUser(session);
        }).catch(() => {
            // Keep a saved session during a temporary connection failure; requests retry renewal.
            if (mounted) setUser(authService.getRememberedUser());
        }).finally(() => { if (mounted) setIsLoading(false); });
        const handleUnauthorized = () => {
            authService.clearSession();
            setUser(null);
            notifications.show({ title: 'Session ended', message: 'Please sign in again.', color: 'red' });
        };
        // Keep remembered sessions consistent when another tab signs out.
        const handleSessionChanged = () => setUser(authService.getRememberedUser());
        const handleStorage = (event: StorageEvent) => {
            if (event.key === SESSION_KEY || event.key === null) handleSessionChanged();
        };
        window.addEventListener('unauthorized', handleUnauthorized);
        window.addEventListener('storage', handleStorage);
        window.addEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
        return () => {
            mounted = false;
            window.removeEventListener('unauthorized', handleUnauthorized);
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
        };
    }, []);

    useEffect(() => {
        if (!user) return;
        let mounted = true;
        let timer: ReturnType<typeof setTimeout>;
        const schedule = (session: AdminSession) => {
            const remaining = Date.parse(session.accessTokenExpiration) - Date.now() - (session.refreshToken ? REFRESH_BEFORE_EXPIRY_MS : 0);
            timer = setTimeout(checkExpiry, Math.min(Math.max(remaining, 1000), 2147483647));
        };
        const checkExpiry = async () => {
            try {
                const session = await authService.getSession();
                if (mounted && session) {
                    setUser(session);
                    schedule(session);
                }
            } catch {
                // A temporary outage should not erase Remember Me or force another password login.
                if (mounted) timer = setTimeout(checkExpiry, 30000);
            }
        };
        schedule(user);
        return () => { mounted = false; clearTimeout(timer); };
    }, [user]);

    const login = async (username: string, password: string, remember: boolean) => {
        const session = await authService.login(username, password, remember);
        setUser(session);
        return true;
    };

    const logout = () => {
        // Clear the UI and storage immediately even when the server is unreachable.
        setUser(null);
        void authService.logout().catch(() => {
            notifications.show({ title: 'Signed out on this device', message: 'The server could not confirm sign-out.', color: 'yellow' });
        });
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
