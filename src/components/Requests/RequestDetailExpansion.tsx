import React, { useState } from 'react';
import { Text, Box, Paper, Stack, Card, Group, SimpleGrid, Divider, Title, ActionIcon, Image, Modal, Badge, Center, Grid } from '@mantine/core';
import { IconInfoCircle, IconUser, IconMapPin, IconClock, IconHash, IconChevronLeft, IconChevronRight, IconMaximize } from '@tabler/icons-react';
import { Post } from '../../services/requestService';

import { useMetadata } from '../../context/MetadataContext';

interface RequestDetailExpansionProps {
    data: Post;
}

export const RequestDetailExpansion: React.FC<RequestDetailExpansionProps> = ({ data }) => {
    const { getTranslation } = useMetadata();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [opened, setOpened] = useState(false);

    const images = data.images || [];
    const hasImages = images.length > 0;

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const getImageUrl = (img: any) => {
        if (!img) return '';
        return typeof img === 'string' ? img : img?.url || img?.path || '';
    };

    return (
        <Paper p="lg" withBorder bg="var(--mantine-color-gray-0)" radius="md">
            <Stack gap="xl">
                {/* Header Section */}
                <Group justify="space-between" align="center">
                    <Group gap="sm">
                        <IconHash size={24} color="var(--mantine-color-blue-filled)" />
                        <Stack gap={0}>
                            <Title order={4}>Request #{data.id}</Title>
                            <Text size="sm" c="dimmed">{getTranslation('categories', data.categoryId)}</Text>
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
                            <DetailItem label="Status" value={getTranslation('postStatuses', data.statusId)} />
                            <DetailItem label="Urgency Level" value={getTranslation('urgencyLevels', data.urgencyLevelId)} />
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
                            <DetailItem label="Contact Type" value={getTranslation('contactTypes', data.contactTypeId)} />
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

                {/* Bottom Section: Content & Images */}
                <Grid gutter="lg">
                    {/* Content Card */}
                    <Grid.Col span={{ base: 12, md: hasImages ? 8 : 12 }}>
                        <Card withBorder padding="md" radius="md" h="100%">
                            <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb="xs">Request Content</Text>
                            <Box p="md" bg="var(--mantine-color-gray-1)" style={{ borderRadius: 'var(--mantine-radius-sm)', flex: 1 }}>
                                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                    {data.content || 'No content provided.'}
                                </Text>
                            </Box>
                        </Card>
                    </Grid.Col>

                    {/* Image Card */}
                    {hasImages && (
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Card withBorder padding="md" radius="md" h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
                                <Group justify="space-between" mb="xs">
                                    <Text size="xs" c="dimmed" fw={600} tt="uppercase">Images ({images.length})</Text>
                                    {images.length > 1 && (
                                        <Text size="xs" fw={700} c="blue">{currentImageIndex + 1} / {images.length}</Text>
                                    )}
                                </Group>

                                <Box pos="relative" style={{ flex: 1, minHeight: 200, cursor: 'zoom-in' }} onClick={() => setOpened(true)}>
                                    <Image
                                        src={getImageUrl(images[currentImageIndex])}
                                        height={200}
                                        fit="cover"
                                        radius="sm"
                                        fallbackSrc="https://placehold.co/600x400?text=No+Image"
                                    />

                                    {images.length > 1 && (
                                        <>
                                            <ActionIcon
                                                pos="absolute"
                                                left={10}
                                                top="50%"
                                                style={{ transform: 'translateY(-50%)', zIndex: 10 }}
                                                variant="filled"
                                                onClick={prevImage}
                                                radius="xl"
                                                size="sm"
                                            >
                                                <IconChevronLeft size={14} />
                                            </ActionIcon>
                                            <ActionIcon
                                                pos="absolute"
                                                right={10}
                                                top="50%"
                                                style={{ transform: 'translateY(-50%)', zIndex: 10 }}
                                                variant="filled"
                                                onClick={nextImage}
                                                radius="xl"
                                                size="sm"
                                            >
                                                <IconChevronRight size={14} />
                                            </ActionIcon>
                                        </>
                                    )}

                                    <Box pos="absolute" bottom={10} right={10}>
                                        <Badge size="xs" variant="filled" color="dark.4" leftSection={<IconMaximize size={10} />}>
                                            Zoom
                                        </Badge>
                                    </Box>
                                </Box>
                            </Card>
                        </Grid.Col>
                    )}
                </Grid>
            </Stack>

            {/* Zoom Modal */}
            <Modal opened={opened} onClose={() => setOpened(false)} size="lg" centered padding={0} withCloseButton={false}>
                <Box pos="relative" bg="black" p="xs">
                    <Image
                        src={getImageUrl(images[currentImageIndex])}
                        fit="contain"
                        mah="80vh"
                    />
                    <ActionIcon
                        pos="absolute"
                        top={10}
                        right={10}
                        variant="filled"
                        color="dark"
                        onClick={() => setOpened(false)}
                        radius="xl"
                        style={{ zIndex: 100 }}
                    >
                        <Text style={{ transform: 'rotate(45deg)', fontSize: 20, lineHeight: 1 }}>+</Text>
                    </ActionIcon>

                    {images.length > 1 && (
                        <Group pos="absolute" bottom={20} left="50%" style={{ transform: 'translateX(-50%)', zIndex: 100 }} gap="xs">
                            <ActionIcon variant="filled" color="blue" onClick={prevImage} radius="xl" size="lg"><IconChevronLeft size={20} /></ActionIcon>
                            <Badge color="dark" size="lg" variant="filled" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>{currentImageIndex + 1} / {images.length}</Badge>
                            <ActionIcon variant="filled" color="blue" onClick={nextImage} radius="xl" size="lg"><IconChevronRight size={20} /></ActionIcon>
                        </Group>
                    )}
                </Box>
            </Modal>
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
