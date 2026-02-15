import mockData from '../data/mockDb.json';

export interface User {
    name: string;
    email: string;
    phone?: string;
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
    private currentUser: User | null = null;

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
            this.currentUser = userWithoutPassword; // Set valid session
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
        this.currentUser = user;
    }

    /**
     * Retrieves user session.
     * Checks memory first, then localStorage.
     */
    getToken(): string | undefined {
        return this.currentUser?.token || this.getRememberedUser()?.token;
    }

    /**
     * Retrieves user session from localStorage.
     */
    getRememberedUser(): User | null {
        const data = localStorage.getItem('willingapp_user');
        const user = data ? JSON.parse(data) : null;
        if (user && !this.currentUser) {
            this.currentUser = user; // Sync memory if page reloaded
        }
        return user;
    }

    /**
     * Clears user session.
     */
    logout() {
        localStorage.removeItem('willingapp_user');
        this.currentUser = null;
    }
}

const authService = new AuthService();
export default authService;
