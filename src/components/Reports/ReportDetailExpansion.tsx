import React from 'react';
import { Text, Box, Paper, Stack, Card, Group, SimpleGrid, Divider, Title, Avatar, Badge, Grid } from '@mantine/core';
import { IconInfoCircle, IconUser, IconMessage, IconFileText, IconAlertTriangle, IconPhoto } from '@tabler/icons-react';
import { Report } from '../../services/apiTypes';
import { useMetadata } from '../../context/MetadataContext';

interface ReportDetailExpansionProps {
    data: Report;
}

export const ReportDetailExpansion: React.FC<ReportDetailExpansionProps> = ({ data }) => {
    const { getTranslation } = useMetadata();
    const { report, reporter, reportedUser, request, admin: embeddedAdmin } = data;

    const getStatusLabel = (status: number) => {
        if (status === 1) return 'Open';
        if (status === 2) return 'Deleted';
        if (status === 3) return 'Approved';
        return 'Unknown';
    };

    return (
        <Paper p="lg" withBorder bg="var(--mantine-color-gray-0)" radius="md">
            <Stack gap="xl">
                {/* Header Section */}
                <Group justify="space-between" align="center">
                    <Group gap="sm">
                        <IconAlertTriangle size={24} color="var(--mantine-color-red-filled)" />
                        <Stack gap={0}>
                            <Title order={4}>Report #{report.id}</Title>
                            <Text size="sm" c="dimmed">Status: {getStatusLabel(report.status)}</Text>
                        </Stack>
                    </Group>
                </Group>

                <Divider />

                {/* Cards Section */}
                <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="lg">
                    {/* Reporter Card */}
                    <Card withBorder padding="md" radius="md" shadow="sm">
                        <Card.Section withBorder inheritPadding py="xs" bg="var(--mantine-color-blue-light)">
                            <Group gap="xs">
                                <IconUser size={18} />
                                <Text fw={600} size="sm">Reporter</Text>
                            </Group>
                        </Card.Section>
                        <Stack gap="sm" mt="md">
                            <DetailItem label="User ID" value={reporter.id} />
                            <DetailItem label="Name" value={reporter.name || 'Anonymous'} />
                            <DetailItem label="Phone" value={reporter.phone || '-'} />
                            <DetailItem label="Joined" value={new Date(reporter.creationTime).toLocaleDateString()} />
                        </Stack>
                    </Card>

                    {/* Reported User Card */}
                    <Card withBorder padding="md" radius="md" shadow="sm">
                        <Card.Section withBorder inheritPadding py="xs" bg="var(--mantine-color-orange-light)">
                            <Group gap="xs">
                                <IconUser size={18} />
                                <Text fw={600} size="sm">Reported User</Text>
                            </Group>
                        </Card.Section>
                        <Stack gap="sm" mt="md">
                            <DetailItem label="User ID" value={reportedUser.id} />
                            <DetailItem label="Name" value={reportedUser.name || 'Anonymous'} />
                            <DetailItem label="Phone" value={reportedUser.phone || '-'} />
                            <DetailItem label="Joined" value={new Date(reportedUser.creationTime).toLocaleDateString()} />
                        </Stack>
                    </Card>

                    {/* Request Card */}
                    <Card withBorder padding="md" radius="md" shadow="sm">
                        <Card.Section withBorder inheritPadding py="xs" bg="var(--mantine-color-teal-light)">
                            <Group gap="xs">
                                <IconFileText size={18} />
                                <Text fw={600} size="sm">Request Details</Text>
                            </Group>
                        </Card.Section>
                        <Stack gap="sm" mt="md">
                            <DetailItem label="Request ID" value={request.id} />
                            <DetailItem label="Category" value={getTranslation('categories', request.categoryId)} />
                            <DetailItem label="City" value={request.place?.city?.names?.[0]?.name || '-'} />
                            <DetailItem label="Created" value={new Date(request.creationTime).toLocaleDateString()} />
                        </Stack>
                    </Card>

                    {/* Report Card - Full Info */}
                    <Card withBorder padding="md" radius="md" shadow="sm">
                        <Card.Section withBorder inheritPadding py="xs" bg="var(--mantine-color-red-light)">
                            <Group gap="xs">
                                <IconInfoCircle size={18} />
                                <Text fw={600} size="sm">Full Report Info</Text>
                            </Group>
                        </Card.Section>
                        <Stack gap="sm" mt="md">
                            <DetailItem label="Report ID" value={report.id} />
                            <DetailItem label="Creation Time" value={new Date(report.creationTime).toLocaleString()} />
                            <DetailItem label="Update Time" value={new Date(report.updateTime).toLocaleString()} />
                            <DetailItem
                                label="Handled By"
                                value={embeddedAdmin ? `(${embeddedAdmin.id}) ${embeddedAdmin.firstName} ${embeddedAdmin.lastName}` : (report.handledByAdminId ? `(${report.handledByAdminId})` : 'None')}
                            />
                        </Stack>
                    </Card>
                </SimpleGrid>

                {/* Content Section */}
                <Grid gutter="lg">
                    {/* Report Description */}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Card withBorder padding="md" radius="md">
                            <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb="xs">Report Description</Text>
                            <Box p="md" bg="var(--mantine-color-gray-1)" style={{ borderRadius: 'var(--mantine-radius-sm)' }}>
                                <Text size="sm">{report.description}</Text>
                            </Box>
                        </Card>
                    </Grid.Col>

                    {/* Post Content */}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Card withBorder padding="md" radius="md">
                            <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb="xs">Request Content Snippet</Text>
                            <Box p="md" bg="var(--mantine-color-gray-1)" style={{ borderRadius: 'var(--mantine-radius-sm)' }}>
                                <Group gap="sm" wrap="nowrap" align="flex-start">
                                    {request.images && request.images.length > 0 && (
                                        <Avatar src={request.images[0].url} radius="sm" size="lg" />
                                    )}
                                    <Text size="sm" style={{ flex: 1 }}>{request.content}</Text>
                                </Group>
                            </Box>
                        </Card>
                    </Grid.Col>
                </Grid>
            </Stack>
        </Paper>
    );
};

const DetailItem = ({ label, value }: { label: string; value: string | number }) => (
    <Box>
        <Text size="xs" c="dimmed" fw={600} tt="uppercase" lts={0.5} mb={2}>
            {label}
        </Text>
        <Text size="sm" fw={500}>{value}</Text>
    </Box>
);
