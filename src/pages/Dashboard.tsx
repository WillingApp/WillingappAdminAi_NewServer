import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
    Title,
    Text,
    SimpleGrid,
    Paper,
    Group,
    Stack,
    ThemeIcon,
    RingProgress,
    Center,
    Loader,
    Alert,
    rem,
    useMantineTheme,
    Menu,
    Button,
    ActionIcon,
    Grid,
    Popover,
    InputBase
} from '@mantine/core';
import { DatePickerInput, DatePicker } from '@mantine/dates';
import { LineChart, PieChart } from '@mantine/charts';
import { IconArrowUpRight, IconArrowDownRight, IconCalendar, IconAlertCircle, IconClock } from '@tabler/icons-react';
import { fetchDashboardData, DashboardData, SummaryItem, CategoryData } from '../services/dashboardService';
import '@mantine/charts/styles.css';
import '@mantine/dates/styles.css';
import DashboardAISummary from '../components/DashboardAISummary';

const Dashboard: React.FC = () => {
    const theme = useMantineTheme();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await fetchDashboardData(dateRange[0], dateRange[1]);
                setData(result);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
                setError("Failed to load dashboard data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [dateRange]);

    const setPreset = (range: 'today' | 'yesterday' | 'week' | 'month' | '3months' | 'year') => {
        const today = dayjs();
        let start: Date;
        let end: Date = today.toDate();

        switch (range) {
            case 'today':
                start = today.startOf('day').toDate();
                end = today.endOf('day').toDate();
                break;
            case 'yesterday':
                start = today.subtract(1, 'day').startOf('day').toDate();
                end = today.subtract(1, 'day').endOf('day').toDate();
                break;
            case 'week':
                start = today.subtract(7, 'days').toDate();
                break;
            case 'month':
                start = today.subtract(1, 'month').toDate();
                break;
            case '3months':
                start = today.subtract(3, 'months').toDate();
                break;
            case 'year':
                start = today.subtract(1, 'year').toDate();
                break;
            default:
                start = today.toDate();
        }
        setDateRange([start, end]);
    };

    if (loading) {
        return (
            <Center style={{ height: '100%' }}>
                <Loader size="lg" />
            </Center>
        );
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
                {error}
            </Alert>
        );
    }

    if (!data) return null;

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="center">
                <Title order={2}>Dashboard</Title>
                <Group gap="xs">
                    <Popover position="bottom-end" shadow="md" trapFocus>
                        <Popover.Target>
                            <InputBase
                                component="button"
                                pointer
                                leftSection={<IconCalendar size="1.1rem" stroke={1.5} />}
                                onClick={() => { }}
                                style={{ width: 330 }}
                            >
                                {dateRange[0] ? (
                                    <>
                                        {dayjs(dateRange[0]).format('DD/MM/YYYY')} - {' '}
                                        {dateRange[1] ? dayjs(dateRange[1]).format('DD/MM/YYYY') : '...'}
                                    </>
                                ) : (
                                    <Text c="dimmed">Pick date range</Text>
                                )}
                            </InputBase>
                        </Popover.Target>
                        <Popover.Dropdown p={0}>
                            <div style={{ padding: 'xs' }}>
                                <DatePicker
                                    type="range"
                                    value={dateRange}
                                    onChange={(value) => setDateRange(value as [Date | null, Date | null])}
                                />
                            </div>
                            <Stack gap={5} p="xs" style={{ borderTop: `1px solid ${theme.colors.gray[2]}` }}>
                                <Text size="xs" fw={700} c="dimmed" tt="uppercase" px={5}>
                                    Quick Select
                                </Text>
                                <SimpleGrid cols={3} spacing={5}>
                                    <Button variant="subtle" size="xs" onClick={() => setPreset('today')}>Today</Button>
                                    <Button variant="subtle" size="xs" onClick={() => setPreset('yesterday')}>Yesterday</Button>
                                    <Button variant="subtle" size="xs" onClick={() => setPreset('week')}>7 Days</Button>
                                    <Button variant="subtle" size="xs" onClick={() => setPreset('month')}>Month</Button>
                                    <Button variant="subtle" size="xs" onClick={() => setPreset('3months')}>3 Months</Button>
                                    <Button variant="subtle" size="xs" onClick={() => setPreset('year')}>Year</Button>
                                </SimpleGrid>
                            </Stack>
                        </Popover.Dropdown>
                    </Popover>
                </Group>
            </Group>

            {/* KPI Section */}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 5 }} spacing="md">
                <KpiCard
                    title="Total Users"
                    subtitle="(Between dates)"
                    value={data.summary.totalUsers.current}
                    trend={data.summary.totalUsers.trend}
                    isPositive={data.summary.totalUsers.isPositive}
                />
                <KpiCard
                    title="Total Requests"
                    subtitle="(Between dates)"
                    value={data.summary.totalRequests.current}
                    trend={data.summary.totalRequests.trend}
                    isPositive={data.summary.totalRequests.isPositive}
                />
                <KpiCard
                    title="Active Requests"
                    subtitle="(Status open)"
                    value={data.summary.activeRequests.current}
                    trend={data.summary.activeRequests.trend}
                    isPositive={data.summary.activeRequests.isPositive}
                />
                <KpiCard
                    title="Active Users"
                    subtitle="(Connected last 60 days)"
                    value={data.summary.activeUsers.current}
                    trend={data.summary.activeUsers.trend}
                    isPositive={data.summary.activeUsers.isPositive}
                />
                <KpiCard
                    title="Unique Users"
                    subtitle="(Users posted last 30 days)"
                    value={data.summary.uniqueUsersRequests.current}
                    trend={data.summary.uniqueUsersRequests.trend}
                    isPositive={data.summary.uniqueUsersRequests.isPositive}
                />
            </SimpleGrid>

            {/* Charts Section */}
            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
                <Paper withBorder p="md" radius="md" shadow="sm">
                    <Title order={3} size="h4" mb="lg">User Growth</Title>
                    <LineChart
                        h={300}
                        data={data.userGrowth}
                        dataKey="month"
                        series={[
                            { name: 'count', color: 'blue.6' },
                        ]}
                        curveType="monotone"
                        withDots
                        withTooltip
                        gridAxis="xy"
                    />
                </Paper>

                <Paper withBorder p="md" radius="md" shadow="sm">
                    <Title order={3} size="h4" mb="lg">Category Distribution</Title>
                    <Grid align="center" gutter="xl">
                        {/* Legend on the left */}
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Stack gap="xs">
                                {data.categoryDistribution.map((item: CategoryData) => (
                                    <Group key={item.label} gap="xs" wrap="nowrap">
                                        <div style={{
                                            width: 10,
                                            height: 10,
                                            backgroundColor: item.color,
                                            borderRadius: '50%',
                                            flexShrink: 0
                                        }} />
                                        <Text size="sm" c="dimmed" truncate>
                                            {item.label}: {item.value}%
                                        </Text>
                                    </Group>
                                ))}
                            </Stack>
                        </Grid.Col>

                        {/* Centered Filled Pie Chart */}
                        <Grid.Col span={{ base: 12, md: 8 }}>
                            <Center>
                                <PieChart
                                    withTooltip
                                    withLabels
                                    labelsType="percent"
                                    labelsPosition="inside"
                                    size={240}
                                    strokeWidth={0}
                                    data={data.categoryDistribution.map((item: CategoryData) => ({
                                        name: item.label,
                                        value: item.value,
                                        color: item.color
                                    }))}
                                />
                            </Center>
                        </Grid.Col>
                    </Grid>
                </Paper>
            </SimpleGrid>

            {/* AI Summary Section */}
            <DashboardAISummary data={data} />
        </Stack>
    );
};

// Helper Component for KPI Cards
interface KpiCardProps {
    title: string;
    subtitle?: string;
    value: number;
    trend: number;
    isPositive: boolean;
    isGrowthRate?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, subtitle, value, trend, isPositive, isGrowthRate }) => {
    const diff = Math.abs(trend);

    return (
        <Paper withBorder p="md" radius="md" shadow="sm">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Stack gap={0}>
                    <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                        {title}
                    </Text>
                    {subtitle && (
                        <Text size="xs" c="dimmed" fw={500} style={{ fontStyle: 'italic' }}>
                            {subtitle}
                        </Text>
                    )}
                </Stack>
                <ThemeIcon
                    color={isPositive ? 'teal' : 'red'}
                    variant="light"
                    size={38}
                    radius="md"
                    style={{ flexShrink: 0 }}
                >
                    {isPositive ? (
                        <IconArrowUpRight style={{ width: rem(24), height: rem(24) }} stroke={1.5} />
                    ) : (
                        <IconArrowDownRight style={{ width: rem(24), height: rem(24) }} stroke={1.5} />
                    )}
                </ThemeIcon>
            </Group>

            <Group align="flex-end" gap="xs" mt={25}>
                <Text fw={700} fz="xl" lh={1}>
                    {value.toLocaleString()}
                    {isGrowthRate && '%'}
                </Text>
                <Text c={isPositive ? 'teal' : 'red'} fz="sm" fw={500} lh={1}>
                    <span>{trend > 0 ? '+' : ''}{trend}%</span>
                </Text>
            </Group>

            <Text fz="xs" c="dimmed" mt={7}>
                Compared to previous month
            </Text>
        </Paper>
    );
};

export default Dashboard;
