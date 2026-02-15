import reportsMock from '../data/ReportsDataMock.json';
import { PaginationParams, ApiResponse, Report } from './apiTypes';

export interface ReportsResponse extends ApiResponse<{
    items: Report[];
    total: number;
}> { }

class ReportService {
    private reports: Report[] = [];
    private storageKey = 'willingapp_reports_mock';

    constructor() {
        this.init();
    }

    private init() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Check if it's the new format (array of objects with 'report' property and 'request')
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].report && parsed[0].request) {
                    this.reports = parsed;
                } else {
                    // Force refresh from mock if old format
                    throw new Error('Old format');
                }
            } catch (e) {
                this.loadFromMock();
            }
        } else {
            this.loadFromMock();
        }
    }

    private loadFromMock() {
        const rawReports = (reportsMock as any) || [];
        this.reports = rawReports.map((r: any) => ({
            id: r.report?.id || Math.random(),
            ...r
        }));
        this.persist();
    }

    private persist() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.reports));
    }

    /**
     * Fetches reports with pagination.
     */
    getReports = async (params: PaginationParams): Promise<ReportsResponse> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const searchTerm = params.Filter?.Search?.SearchTerm?.toLowerCase() || '';
        let filtered = this.reports;

        if (searchTerm) {
            filtered = this.reports.filter(r =>
                r.report.description.toLowerCase().includes(searchTerm) ||
                r.reporter.name?.toLowerCase().includes(searchTerm) ||
                r.reportedUser.name?.toLowerCase().includes(searchTerm) ||
                r.request.content.toLowerCase().includes(searchTerm) ||
                r.reporter.phone?.includes(searchTerm) ||
                r.reportedUser.phone?.includes(searchTerm)
            );
        }

        const total = filtered.length;
        const items = filtered.slice(params.skip, params.skip + params.take);

        return {
            data: {
                items,
                total
            },
            total,
            isSuccessful: true
        } as any;
    };

    /**
     * Resolves a report as valid or invalid.
     */
    resolveReport = async (reportId: number, status: number, adminId: number): Promise<boolean> => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

        // Find the report and update it
        const index = this.reports.findIndex(r => r.report.id === reportId);
        if (index !== -1) {
            this.reports[index].report.status = status;
            this.reports[index].report.handledByAdminId = adminId;
            this.reports[index].report.updateTime = new Date().toISOString();
            this.persist();
            return true;
        }
        return false;
    };

    /**
     * Sends a message to a user involved in a report.
     */
    sendMessage = async (userId: number, message: string): Promise<void> => {
        console.log(`[ReportService] Sending message to user ${userId}: ${message}`);
        await new Promise(resolve => setTimeout(resolve, 800));
    };

    /**
     * Resets the data to the original mock state.
     */
    resetData = () => {
        localStorage.removeItem(this.storageKey);
        this.init();
    };
}

const reportService = new ReportService();
export default reportService;
