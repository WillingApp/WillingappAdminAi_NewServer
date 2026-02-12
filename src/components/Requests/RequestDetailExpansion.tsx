import React from 'react';
import { Text, Box, Paper, Stack, Card, Group, SimpleGrid, Divider, Title } from '@mantine/core';
import { IconInfoCircle, IconUser, IconMapPin, IconClock, IconHash, IconCategory } from '@tabler/icons-react';
import { Post } from '../../services/requestService';

interface RequestDetailExpansionProps {
    data: Post;
}

export const RequestDetailExpansion: React.FC<RequestDetailExpansionProps> = ({ data }) => {
    return (
        <Paper p="lg" withBorder bg="var(--mantine-color-gray-0)" radius="md">
            <Stack gap="xl">
                {/* Header Section */}
                <Group justify="space-between" align="center">
                    <Group gap="sm">
                        <IconHash size={24} color="var(--mantine-color-blue-filled)" />
                        <Stack gap={0}>
                            <Title order={4}>Request #{data.id}</Title>
                            <Text size="sm" c="dimmed">Category ID: {data.categoryId}</Text>
                        </Stack>
                    </Group>
                </Group>

                <Divider />

                {/* Cards Section */}
                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                    {/* Card 1 - General & Timing */}
                    <Card withBorder padding="md" radius="md" shadow="sm">
                        <Card.Section withBorder inheritPadding py="xs" bg="var(--mantine-color-blue-light)">
                            <Group gap="xs">
                                <IconInfoCircle size={18} />
                                <Text fw={600} size="sm">General & Timing</Text>
                            </Group>
                        </Card.Section>
                        <Stack gap="sm" mt="md">
                            <DetailItem label="Status ID" value={data.statusId} />
                            <DetailItem label="Urgency Level" value={data.urgencyLevelId} />
                            <DetailItem
                                label="Created At"
                                icon={<IconClock size={14} />}
                                value={new Date(data.creationTime).toLocaleString()}
                            />
                            <DetailItem
                                label="Expires At"
                                icon={<IconClock size={14} />}
                                value={new Date(data.expirationTime).toLocaleString()}
                            />
                        </Stack>
                    </Card>

                    {/* Card 2 - Contact & Context */}
                    <Card withBorder padding="md" radius="md" shadow="sm">
                        <Card.Section withBorder inheritPadding py="xs" bg="var(--mantine-color-teal-light)">
                            <Group gap="xs">
                                <IconUser size={18} />
                                <Text fw={600} size="sm">Contact & Context</Text>
                            </Group>
                        </Card.Section>
                        <Stack gap="sm" mt="md">
                            <DetailItem label="Contact Name" value={data.contactName || 'Anonymous'} />
                            <DetailItem label="Phone Number" value={data.contactPhone || '-'} />
                            <DetailItem label="User (Sender) ID" value={data.userId} />
                            <DetailItem label="Group ID" value={data.groupId || '-'} />
                        </Stack>
                    </Card>

                    {/* Card 3 - Location */}
                    <Card withBorder padding="md" radius="md" shadow="sm">
                        <Card.Section withBorder inheritPadding py="xs" bg="var(--mantine-color-orange-light)">
                            <Group gap="xs">
                                <IconMapPin size={18} />
                                <Text fw={600} size="sm">Location</Text>
                            </Group>
                        </Card.Section>
                        <Stack gap="sm" mt="md">
                            <DetailItem label="City" value={data.place?.city?.names?.[0]?.name || '-'} />
                            <DetailItem label="Address" value={data.place?.location?.names?.[0]?.name || '-'} />
                            <DetailItem label="Coordinates" value={`${data.place?.location?.latitude?.toFixed(4) || '-'}, ${data.place?.location?.longitude?.toFixed(4) || '-'}`} />
                            <DetailItem label="Distance" value={data.distance || '-'} />
                        </Stack>
                    </Card>
                </SimpleGrid>

                {/* Content Section */}
                <Card withBorder padding="md" radius="md">
                    <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb="xs">Request Content</Text>
                    <Box p="md" bg="var(--mantine-color-gray-1)" style={{ borderRadius: 'var(--mantine-radius-sm)' }}>
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                            {data.content || 'No content provided.'}
                        </Text>
                    </Box>
                </Card>
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
