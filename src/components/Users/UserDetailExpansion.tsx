import React from 'react';
import { Text, Box, Paper, Stack, Card, Group, Avatar, SimpleGrid, Divider, Title } from '@mantine/core';
import { User } from '../../services/userService';
import { IconUser, IconSettings, IconCalendar, IconDeviceFloppy } from '@tabler/icons-react';
import { userStatusLabel } from './userPresentation';

interface UserDetailExpansionProps {
    data: User;
}

const LANGUAGE_MAP: Record<number, string> = {
    1: 'עברית',
    2: 'אנגלית',
    3: 'ערבית',
    4: 'רוסית',
};
const getCountryName = (id: number) => id === 91 ? 'ישראל' : id === 205 ? 'ארצות הברית' : `מדינה ${id}`;
const getLanguageName = (id: number) => LANGUAGE_MAP[id] || `שפה ${id}`;

export const UserDetailExpansion: React.FC<UserDetailExpansionProps> = ({ data }) => {
    return (
        <Paper p="lg" withBorder bg="var(--mantine-color-gray-0)" radius="md" dir="rtl">
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
                            <Title order={4}>{data.name || 'משתמש ללא שם'}</Title>
                            <Text size="sm" c="dimmed">מזהה משתמש: {data.id}</Text>
                        </Stack>
                    </Group>
                </Group>

                <Divider />

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                    <Card withBorder padding="md" radius="md" shadow="sm">
                        <Card.Section withBorder inheritPadding py="xs" bg="var(--mantine-color-blue-light)">
                            <Group gap="xs">
                                <IconUser size={18} />
                                <Text fw={600} size="sm">פרטים אישיים</Text>
                            </Group>
                        </Card.Section>
                        <Stack gap="sm" mt="md">
                            <DetailItem label="שם מלא" value={data.name || '—'} />
                            <DetailItem label="מספר טלפון" value={data.phone || '—'} />
                            <DetailItem label="שפה" value={getLanguageName(data.languageId)} />
                            <DetailItem label="מדינה" value={getCountryName(data.countryId)} />
                        </Stack>
                    </Card>

                    <Card withBorder padding="md" radius="md" shadow="sm">
                        <Card.Section withBorder inheritPadding py="xs" bg="var(--mantine-color-teal-light)">
                            <Group gap="xs">
                                <IconSettings size={18} />
                                <Text fw={600} size="sm">פרטי חשבון</Text>
                            </Group>
                        </Card.Section>
                        <Stack gap="sm" mt="md">
                            <DetailItem label="סטטוס חשבון" value={userStatusLabel(data.statusId)} />
                            <DetailItem
                                label="תאריך יצירה"
                                icon={<IconCalendar size={14} />}
                                value={new Date(data.creationTime).toLocaleString('he-IL')}
                            />
                            <DetailItem
                                label="עדכון אחרון"
                                icon={<IconDeviceFloppy size={14} />}
                                value={new Date(data.updateTime).toLocaleString('he-IL')}
                            />
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
