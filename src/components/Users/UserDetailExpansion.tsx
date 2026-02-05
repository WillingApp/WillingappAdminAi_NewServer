import React from 'react';
import { Grid, Text, Box, Paper, Divider, Stack } from '@mantine/core';
import { User } from '../../services/userService';

interface UserDetailExpansionProps {
    data: User;
}

export const UserDetailExpansion: React.FC<UserDetailExpansionProps> = ({ data }) => {
    return (
        <Paper p="md" withBorder bg="var(--mantine-color-gray-0)">
            <Stack gap="sm">
                <Text fw={700} size="sm">User Details</Text>
                <Divider />
                <Grid gutter="xl">
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <DetailItem label="ID" value={data.id} />
                        <DetailItem label="Name" value={data.name || '-'} />
                        <DetailItem label="Phone" value={data.phone || '-'} />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <DetailItem label="Country ID" value={data.countryId} />
                        <DetailItem label="Language ID" value={data.languageId} />
                        <DetailItem label="Status ID" value={data.statusId} />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <DetailItem label="Created At" value={new Date(data.creationTime).toLocaleString()} />
                        <DetailItem label="Updated At" value={new Date(data.updateTime).toLocaleString()} />
                        <DetailItem label="Image URL" value={data.imageUrl || '-'} />
                    </Grid.Col>
                </Grid>
            </Stack>
        </Paper>
    );
};

const DetailItem = ({ label, value }: { label: string; value: string | number }) => (
    <Box mb="xs">
        <Text size="xs" c="dimmed" fw={500} tt="uppercase">
            {label}
        </Text>
        <Text size="sm">{value}</Text>
    </Box>
);
