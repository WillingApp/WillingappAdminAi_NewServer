import React, { useEffect, useState } from 'react';
import {
    Table,
    Paper,
    Title,
    Text,
    Avatar,
    Group,
    Stack,
    Loader,
    Center,
    Alert,
} from '@mantine/core';
import { IconAlertCircle, IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-react';
import { fetchTopGroups, TopGroup } from '../services/groupService';

const TopGroupsTable: React.FC = () => {
    const [groups, setGroups] = useState<TopGroup[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadGroups = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchTopGroups();
                setGroups(data);
            } catch (err) {
                console.error('Failed to fetch top groups:', err);
                setError('שגיאה בטעינת נתוני הקבוצות המובילות.');
            } finally {
                setLoading(false);
            }
        };

        loadGroups();
    }, []);

    if (loading) {
        return (
            <Paper withBorder p="xl" radius="md" shadow="sm">
                <Center h={150}>
                    <Stack align="center" gap="xs">
                        <Loader size="md" />
                        <Text size="sm" c="dimmed">טוען קבוצות מובילות...</Text>
                    </Stack>
                </Center>
            </Paper>
        );
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size="1rem" />} color="red" variant="light" radius="md">
                {error}
            </Alert>
        );
    }

    const rows = groups.map((group) => {
        const trendIsPositive = group.weeklyTrendPercent > 0;
        const trendIsNegative = group.weeklyTrendPercent < 0;
        const trendColor = trendIsPositive ? 'teal' : trendIsNegative ? 'red' : 'gray';
        const TrendIcon = trendIsPositive ? IconTrendingUp : trendIsNegative ? IconTrendingDown : IconMinus;

        return (
            <Table.Tr key={group.id}>
                <Table.Td>
                    <Group gap="sm">
                        <Avatar
                            src={group.image}
                            size={50}
                            radius="xl"
                            imageProps={{ style: { objectFit: 'contain' } }}
                            bg="gray.0"
                        />
                        <Text fz="sm" fw={500}>
                            {group.name}
                        </Text>
                    </Group>
                </Table.Td>
                <Table.Td>
                    <Text fz="sm">{group.admin}</Text>
                </Table.Td>
                <Table.Td>
                    <Text fz="sm" fw={600}>{group.usersCount.toLocaleString()}</Text>
                </Table.Td>
                <Table.Td>
                    <Text fz="sm">{group.postsCount.toLocaleString()}</Text>
                </Table.Td>
                <Table.Td>
                    <Group gap={4} c={trendColor}>
                        <TrendIcon style={{ width: 30, height: 30 }} stroke={1.5} />
                        <Text fz="sm" fw={700}>
                            {group.weeklyTrendPercent > 0 ? '+' : ''}
                            {group.weeklyTrendPercent}%
                        </Text>
                    </Group>
                </Table.Td>
            </Table.Tr>
        );
    });

    return (
        <Paper withBorder p="md" radius="md" shadow="sm">
            <Title order={3} size="h4" mb="md">Top Groups</Title>
            <Table.ScrollContainer minWidth={800}>
                <Table verticalSpacing="sm" highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Group Name</Table.Th>
                            <Table.Th>Group Manager</Table.Th>
                            <Table.Th>Users Count</Table.Th>
                            <Table.Th>Posts Count</Table.Th>
                            <Table.Th>Weekly Trend</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Table.ScrollContainer>
        </Paper>
    );
};

export default TopGroupsTable;
