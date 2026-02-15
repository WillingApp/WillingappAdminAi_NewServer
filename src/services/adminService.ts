import adminData from '../data/AdminUsers.json';

export interface AdminUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password?: string;
    status: number;
    createdAt: string;
    updatedAt: string;
    createdBy: number;
}

const STORAGE_KEY = 'willingapp_admins';

class AdminService {
    private admins: AdminUser[] = [];

    constructor() {
        this.init();
    }

    private init() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            this.admins = JSON.parse(stored);
        } else {
            this.admins = adminData.admins;
            this.persist();
        }
    }

    private persist() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.admins));
    }

    async getAdmins(): Promise<AdminUser[]> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return [...this.admins];
    }

    async updateAdmin(id: string, updates: Partial<AdminUser>): Promise<AdminUser> {
        await new Promise(resolve => setTimeout(resolve, 500));
        const index = this.admins.findIndex(a => a.id === id);
        if (index === -1) throw new Error('Admin not found');

        const updated = {
            ...this.admins[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.admins[index] = updated;
        this.persist();
        return updated;
    }

    async createAdmin(admin: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<AdminUser> {
        await new Promise(resolve => setTimeout(resolve, 500));
        const newAdmin: AdminUser = {
            ...admin,
            id: (Math.max(0, ...this.admins.map(a => parseInt(a.id))) + 1).toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 1 // Hardcoded for now
        };
        this.admins.push(newAdmin);
        this.persist();
        return newAdmin;
    }
}

const adminService = new AdminService();
export default adminService;
