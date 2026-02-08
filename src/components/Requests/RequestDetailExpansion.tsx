import React from 'react';
import { Grid, Text, Box, Paper, SimpleGrid, Card, Group, ThemeIcon } from '@mantine/core';
import { IconInfoCircle, IconUser, IconMapPin, IconClock } from '@tabler/icons-react';
import { Post } from '../../services/requestService';

interface RequestDetailExpansionProps {
    data: Post;
}

export const RequestDetailExpansion: React.FC<RequestDetailExpansionProps> = ({ data }) => {
    return (
        <Paper p="md" bg="var(--mantine-color-gray-0)" withBorder>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">

                {/* General Info Card */}
                <DetailCard title="General" icon={<IconInfoCircle size={16} />}>
                    <DetailItem label="ID" value={data.id} />
                    <DetailItem label="Status ID" value={data.statusId} />
                    <DetailItem label="Urgency" value={data.urgencyLevelId} />
                    <DetailItem label="Active" value={data.isActive ? 'Yes' : 'No'} />
                    <DetailItem label="Category" value={data.categoryId} />
                    <DetailItem label="Group" value={data.groupId || '-'} />
                </DetailCard>

                {/* Contact Card */}
                <DetailCard title="Contact" icon={<IconUser size={16} />}>
                    <DetailItem label="Contact Name" value={data.contactName || '-'} />
                    <DetailItem label="Phone" value={data.contactPhone || '-'} />
                    <DetailItem label="User ID" value={data.userId} />
                    <DetailItem label="Type ID" value={data.contactTypeId} />
                </DetailCard>

                {/* Location Card */}
                <DetailCard title="Location" icon={<IconMapPin size={16} />}>
                    <DetailItem label="City" value={data.place?.city?.names?.[0]?.name || '-'} />
                    <DetailItem label="Address" value={data.place?.location?.names?.[0]?.name || '-'} />
                    <DetailItem label="Lat/Lng" value={`${data.place?.location?.latitude?.toFixed(4) || '-'} / ${data.place?.location?.longitude?.toFixed(4) || '-'}`} />
                    <DetailItem label="Dist. (Loc)" value={data.distanceFromLocation} />
                    <DetailItem label="Distance" value={data.distance || '-'} />
                </DetailCard>

                {/* Timing Card */}
                <DetailCard title="Timing" icon={<IconClock size={16} />}>
                    <DetailItem label="Created" value={new Date(data.creationTime).toLocaleString()} />
                    <DetailItem label="Expires" value={new Date(data.expirationTime).toLocaleString()} />
                    <DetailItem label="Updated" value={new Date(data.updateTime).toLocaleString()} />
                    <DetailItem label="Duration" value={`${data.duration}s`} />
                </DetailCard>

            </SimpleGrid>

            {/* Content Section - Full Width */}
            <Card mt="md" padding="sm" radius="md" withBorder>
                <Text fw={700} size="sm" c="dimmed" tt="uppercase" mb={4}>Content</Text>
                <Box p="xs" bg="gray.1" style={{ borderRadius: 6 }}>
                    <Text size="sm">{data.content}</Text>
                </Box>
            </Card>
        </Paper>
    );
};

const DetailCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <Card padding="sm" radius="md" withBorder h="100%">
        <Group mb="xs" gap="xs">
            <ThemeIcon size="sm" variant="light" color="blue">
                {icon}
            </ThemeIcon>
            <Text fw={700} size="sm" tt="uppercase" c="dimmed">{title}</Text>
        </Group>
        <Box>
            {children}
        </Box>
    </Card>
);

const DetailItem = ({ label, value }: { label: string; value: string | number | undefined | null }) => {
    if (value === undefined || value === null) return null;
    return (
        <Group justify="space-between" mb={4} align="flex-start" wrap="nowrap">
            <Text size="xs" c="dimmed" fw={500} style={{ minWidth: 80 }}>
                {label}:
            </Text>
            <Text size="xs" fw={600} style={{ wordBreak: 'break-word', textAlign: 'right' }}>
                {value}
            </Text>
        </Group>
    );
};
