import dashboardDataRaw from '../data/dashboardData.json';

export interface SummaryItem {
    current: number;
    trend: number;
    isPositive: boolean;
}

export interface GrowthData {
    month: string;
    count: number;
}

export interface CategoryData {
    label: string;
    value: number;
    color: string;
}

export interface DashboardData {
    summary: {
        totalUsers: SummaryItem;
        totalRequests: SummaryItem;
        activeRequests: SummaryItem;
        activeUsers: SummaryItem;
        uniqueUsersRequests: SummaryItem;
    };
    userGrowth: GrowthData[];
    categoryDistribution: CategoryData[];
}

// In a real scenario, this would likely come from an environment variable
// const API_URL = process.env.REACT_APP_API_URL;

export const fetchDashboardData = async (startDate: Date | null, endDate: Date | null): Promise<DashboardData> => {
    // Simulate API network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Log the date range to demonstrate readiness for API integration
    if (startDate && endDate) {
        console.log(`[DashboardService] Fetching data for range: ${startDate.toISOString()} - ${endDate.toISOString()}`);
    } else {
        console.log('[DashboardService] Fetching default data (no date range specified)');
    }

    // The imported JSON is now the DashboardData structure itself
    return dashboardDataRaw as unknown as DashboardData;
};
