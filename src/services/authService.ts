import mockData from '../data/mockDb.json';

export interface User {
    name: string;
    email: string;
    token: string;
}

export interface LoginResponse {
    success: boolean;
    user?: User;
    message?: string;
}

/**
 * AuthService handles authentication logic.
 * Currently using mock data, but structured to be easily replaced with API calls.
 */
class AuthService {
    /**
     * Simulates a login API call.
     * @replace Replace this with an actual fetch/axios call to your backend.
     */
    async login(email: string, password: string): Promise<LoginResponse> {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const userMatch = mockData.users.find(
            (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );

        if (userMatch) {
            const { password: _, ...userWithoutPassword } = userMatch;
            return {
                success: true,
                user: userWithoutPassword,
            };
        }

        return {
            success: false,
            message: 'Invalid email or password',
        };
    }

    /**
     * Persists user session to localStorage.
     */
    rememberUser(user: User) {
        localStorage.setItem('willingapp_user', JSON.stringify(user));
    }

    /**
     * Retrieves user session from localStorage.
     */
    getRememberedUser(): User | null {
        const data = localStorage.getItem('willingapp_user');
        return data ? JSON.parse(data) : null;
    }

    /**
     * Clears user session.
     */
    logout() {
        localStorage.removeItem('willingapp_user');
    }
}

const authService = new AuthService();
export default authService;
