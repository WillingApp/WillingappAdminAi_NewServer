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
    hex: string;
    color?: string; // Optional for manual color overrides if needed by charts
}

export interface DashboardData {
    summary: {
        totalUsers: SummaryItem;
        activePosts: SummaryItem;
        monthlyGrowth: SummaryItem;
    };
    charts: {
        userGrowth: GrowthData[];
        categoryDistribution: CategoryData[];
    };
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

    // Cast the imported JSON to the typed interface
    // In a real app, this is where we would do: axios.get(`${API_URL}/dashboard?start=...&end=...`)
    const data = dashboardDataRaw.dashboardData as unknown as DashboardData;

    // Transform data if necessary (e.g., ensuring colors are mapped for Mantine)
    const transformedChartData = {
        ...data,
        charts: {
            ...data.charts,
            categoryDistribution: data.charts.categoryDistribution.map(item => ({
                ...item,
                color: item.hex // Map 'hex' to 'color' property if chart library expects it, though we might use 'hex' directly
            }))
        }
    };

    return transformedChartData;
};
