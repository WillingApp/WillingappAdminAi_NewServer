import React, { createContext, useContext, useState, useEffect } from 'react';
import authService, { User } from '../services/authService';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string, remember: boolean) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for remembered user on initial load
        const rememberedUser = authService.getRememberedUser();
        if (rememberedUser) {
            setUser(rememberedUser);
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string, remember: boolean) => {
        const response = await authService.login(email, password);
        if (response.success && response.user) {
            setUser(response.user);
            if (remember) {
                authService.rememberUser(response.user);
            }
            return true;
        }
        return false;
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
