import React from 'react';
import { Grid, Text, Box, Paper, Stack, Card, Group, Avatar, SimpleGrid, Badge, Divider } from '@mantine/core';
import { User } from '../../services/userService';
import { IconUser, IconSettings, IconChartBar, IconCalendar, IconDeviceFloppy } from '@tabler/icons-react';

interface UserDetailExpansionProps {
    data: User;
}

const LANGUAGE_MAP: Record<number, string> = {
    1: 'Hebrew',
    2: 'English',
    3: 'Russian',
    4: 'Arabic',
};

const STATUS_MAP: Record<number, string> = {
    1: 'Active',
    2: 'Blocked',
    3: 'Pending',
};

const getCountryName = (id: number) => id === 91 ? 'Israel' : `Unknown (${id})`;
const getLanguageName = (id: number) => LANGUAGE_MAP[id] || `Unknown (${id})`;
const getStatusName = (id: number) => STATUS_MAP[id] || `Unknown (${id})`;

export const UserDetailExpansion: React.FC<UserDetailExpansionProps> = ({ data }) => {
    return (
        <Paper p="lg" withBorder bg="var(--mantine-color-gray-0)" radius="md">
            <Stack gap="xl">
                {/* Header Section */}
                <Group justify="space-between" align="flex-start">
                    <Group gap="md">
                        <Avatar
                            src={data.imageUrl}
                            size={80}
                            radius="md"
                            variant="light"
                            color="blue"
                        >
                            <IconUser size={40} />
                        </Avatar>
                        <Stack gap={0}>
                            <Text fw={700} size="xl">{data.name || 'Anonymous User'}</Text>
                            <Text size="sm" c="dimmed">User ID: {data.id}</Text>
                        </Stack>
                    </Group>
                </Group>

                <Divider />

                {/* Cards Section */}
                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                    {/* Card 1 - Personal Info */}
                    <Card withBorder padding="md" radius="md" shadow="sm">
                        <Card.Section withBorder inheritPadding py="xs" bg="var(--mantine-color-blue-light)">
                            <Group gap="xs">
                                <IconUser size={18} />
                                <Text fw={600} size="sm">Personal Info</Text>
                            </Group>
                        </Card.Section>
                        <Stack gap="sm" mt="md">
                            <DetailItem label="Full Name" value={data.name || '-'} />
                            <DetailItem label="Phone Number" value={data.phone || '-'} />
                            <DetailItem label="Language" value={getLanguageName(data.languageId)} />
                            <DetailItem label="Country" value={getCountryName(data.countryId)} />
                        </Stack>
                    </Card>

                    {/* Card 2 - System Management */}
                    <Card withBorder padding="md" radius="md" shadow="sm">
                        <Card.Section withBorder inheritPadding py="xs" bg="var(--mantine-color-teal-light)">
                            <Group gap="xs">
                                <IconSettings size={18} />
                                <Text fw={600} size="sm">System Management</Text>
                            </Group>
                        </Card.Section>
                        <Stack gap="sm" mt="md">
                            <DetailItem label="Account Status" value={getStatusName(data.statusId)} />
                            <DetailItem
                                label="Created At"
                                icon={<IconCalendar size={14} />}
                                value={new Date(data.creationTime).toLocaleString()}
                            />
                            <DetailItem
                                label="Last Updated"
                                icon={<IconDeviceFloppy size={14} />}
                                value={new Date(data.updateTime).toLocaleString()}
                            />
                        </Stack>
                    </Card>

                    {/* Card 3 - User Activity (Placeholders) */}
                    <Card withBorder padding="md" radius="md" shadow="sm">
                        <Card.Section withBorder inheritPadding py="xs" bg="var(--mantine-color-orange-light)">
                            <Group gap="xs">
                                <IconChartBar size={18} />
                                <Text fw={600} size="sm">User Activity</Text>
                            </Group>
                        </Card.Section>
                        <Stack gap="sm" mt="md">
                            <DetailItem label="Total Posts" value="-" />
                            <DetailItem label="Active Posts" value="-" />
                            <Text size="xs" c="dimmed" fs="italic" mt="xs">
                                * Activity data coming soon from API
                            </Text>
                        </Stack>
                    </Card>
                </SimpleGrid>
            </Stack>
        </Paper>
    );
};

const DetailItem = ({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) => (
    <Box>
        <Group gap={4} mb={2}>
            {icon && <Text c="dimmed" span>{icon}</Text>}
            <Text size="xs" c="dimmed" fw={600} tt="uppercase" lts={0.5}>
                {label}
            </Text>
        </Group>
        <Text size="sm" fw={500}>{value}</Text>
    </Box>
);
