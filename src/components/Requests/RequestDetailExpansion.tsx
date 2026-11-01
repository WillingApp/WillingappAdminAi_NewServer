import React, { useEffect, useState } from 'react';
import { Alert, Badge, Box, Button, Card, Center, Divider, Grid, Group, Image, Loader, Modal, Paper, SimpleGrid, Stack, Text, Title, ActionIcon } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconClock, IconHash, IconInfoCircle, IconMapPin, IconMaximize, IconUser } from '@tabler/icons-react';
import requestService, { Post } from '../../services/requestService';
import { useMetadata } from '../../context/MetadataContext';

interface RequestDetailExpansionProps {
    data: Post;
}

function formatDate(value: string | null): string {
    if (!value || !Number.isFinite(Date.parse(value))) return '-';
    return new Date(value).toLocaleString();
}

function translatedName(names: { languageId: number; name: string }[] | null | undefined): string {
    return names?.find(item => item.languageId === 1)?.name || names?.[0]?.name || '-';
}

function coordinates(post: Post): string {
    const latitude = post.place?.location?.latitude;
    const longitude = post.place?.location?.longitude;
    return typeof latitude === 'number' && typeof longitude === 'number'
        ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : '-';
}

export const RequestDetailExpansion: React.FC<RequestDetailExpansionProps> = ({ data }) => {
    const { getTranslation } = useMetadata();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retry, setRetry] = useState(0);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [opened, setOpened] = useState(false);

    useEffect(() => {
        let active = true;
        setPost(null);
        setLoading(true);
        setError(null);
        setCurrentImageIndex(0);
        setOpened(false);
        void requestService.getPost(data.id).then(result => {
            if (active) setPost(result);
        }).catch((cause: unknown) => {
            if (active) setError(cause instanceof Error ? cause.message : 'Failed to load post details.');
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, [data.id, retry]);

    if (loading) return <Center py="lg"><Loader size="sm" aria-label="Loading post details" /></Center>;
    if (error) return <Alert color="red" title="Failed to load post details">
        <Text mb="xs">{error}</Text>
        <Button size="xs" variant="light" onClick={() => setRetry(value => value + 1)}>Retry details</Button>
    </Alert>;
    if (!post) return null;

    const images = post.images.filter(image => typeof image.url === 'string' && image.url.trim().length > 0);
    const hasImages = images.length > 0;
    const currentImage = images[currentImageIndex];
    const nextImage = (event: React.MouseEvent) => {
        event.stopPropagation();
        setCurrentImageIndex(index => (index + 1) % images.length);
    };
    const previousImage = (event: React.MouseEvent) => {
        event.stopPropagation();
        setCurrentImageIndex(index => (index - 1 + images.length) % images.length);
    };

    return (
        <Paper p="lg" withBorder bg="var(--mantine-color-gray-0)" radius="md">
            <Stack gap="xl">
                <Group gap="sm">
                    <IconHash size={24} color="var(--mantine-color-blue-filled)" />
                    <Stack gap={0}>
                        <Title order={4}>Request #{post.id}</Title>
                        <Text size="sm" c="dimmed">{getTranslation('categories', post.categoryId)}</Text>
                    </Stack>
                </Group>
                <Divider />
                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                    <Card withBorder padding="md" radius="md" shadow="sm">
                        <Card.Section withBorder inheritPadding py="xs" bg="var(--mantine-color-blue-light)">
                            <Group gap="xs"><IconInfoCircle size={18} /><Text fw={600} size="sm">General & Timing</Text></Group>
                        </Card.Section>
                        <Stack gap="sm" mt="md">
                            <DetailItem label="Status" value={getTranslation('postStatuses', post.statusId)} />
                            <DetailItem label="Urgency Level" value={getTranslation('urgencyLevels', post.urgencyLevelId)} />
                            <DetailItem label="Active" value={post.isActive ? 'Yes' : 'No'} />
                            <DetailItem label="Public" value={post.isPublic ? 'Yes' : 'No'} />
                            <DetailItem label="Duration" value={post.duration ?? '-'} />
                            <DetailItem label="Created At" icon={<IconClock size={14} />} value={formatDate(post.creationTime)} />
                            <DetailItem label="Updated At" icon={<IconClock size={14} />} value={formatDate(post.updateTime)} />
                            <DetailItem label="Expires At" icon={<IconClock size={14} />} value={formatDate(post.expirationTime)} />
                        </Stack>
                    </Card>
                    <Card withBorder padding="md" radius="md" shadow="sm">
                        <Card.Section withBorder inheritPadding py="xs" bg="var(--mantine-color-teal-light)">
                            <Group gap="xs"><IconUser size={18} /><Text fw={600} size="sm">Contact & Context</Text></Group>
                        </Card.Section>
                        <Stack gap="sm" mt="md">
                            <DetailItem label="Publisher" value={post.user?.name || `#${post.userId}`} />
                            <DetailItem label="Publisher ID" value={post.userId} />
                            <DetailItem label="Publisher Phone" value={post.user?.phone || '-'} />
                            <DetailItem label="Contact Name" value={post.contactName || '-'} />
                            <DetailItem label="Contact Phone" value={post.contactPhone || '-'} />
                            <DetailItem label="Contact Country ID" value={post.contactCountryId ?? '-'} />
                            <DetailItem label="Contact Type" value={getTranslation('contactTypes', post.contactTypeId)} />
                            <DetailItem label="Group" value={post.group?.name || post.groupName || (post.groupId ? `#${post.groupId}` : 'No group')} />
                            <DetailItem label="Group ID" value={post.groupId ?? '-'} />
                        </Stack>
                    </Card>
                    <Card withBorder padding="md" radius="md" shadow="sm">
                        <Card.Section withBorder inheritPadding py="xs" bg="var(--mantine-color-orange-light)">
                            <Group gap="xs"><IconMapPin size={18} /><Text fw={600} size="sm">Location</Text></Group>
                        </Card.Section>
                        <Stack gap="sm" mt="md">
                            <DetailItem label="City" value={translatedName(post.place?.city?.names)} />
                            <DetailItem label="Address" value={translatedName(post.place?.location?.names)} />
                            <DetailItem label="Location ID" value={post.locationId} />
                            <DetailItem label="Coordinates" value={coordinates(post)} />
                            <DetailItem label="Distance" value={post.distance ?? '-'} />
                            <DetailItem label="Distance From Location" value={post.distanceFromLocation ?? '-'} />
                        </Stack>
                    </Card>
                </SimpleGrid>
                <Grid gutter="lg">
                    <Grid.Col span={{ base: 12, md: hasImages ? 8 : 12 }}>
                        <Card withBorder padding="md" radius="md" h="100%">
                            <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb="xs">Request Content</Text>
                            <Box p="md" bg="var(--mantine-color-gray-1)" style={{ borderRadius: 'var(--mantine-radius-sm)', flex: 1 }}>
                                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{post.content || 'No content provided.'}</Text>
                            </Box>
                        </Card>
                    </Grid.Col>
                    {hasImages && <Grid.Col span={{ base: 12, md: 4 }}>
                        <Card withBorder padding="md" radius="md" h="100%">
                            <Group justify="space-between" mb="xs">
                                <Text size="xs" c="dimmed" fw={600} tt="uppercase">Images ({images.length})</Text>
                                {images.length > 1 && <Text size="xs" fw={700} c="blue">{currentImageIndex + 1} / {images.length}</Text>}
                            </Group>
                            <Box pos="relative" style={{ cursor: 'zoom-in' }} onClick={() => setOpened(true)}>
                                <Image src={currentImage.url} alt={`Post ${post.id} image ${currentImageIndex + 1}`} height={200} fit="cover" radius="sm" />
                                {images.length > 1 && <>
                                    <ActionIcon pos="absolute" left={10} top="50%" variant="filled" onClick={previousImage} aria-label="Previous image" radius="xl" size="sm"><IconChevronLeft size={14} /></ActionIcon>
                                    <ActionIcon pos="absolute" right={10} top="50%" variant="filled" onClick={nextImage} aria-label="Next image" radius="xl" size="sm"><IconChevronRight size={14} /></ActionIcon>
                                </>}
                                <Box pos="absolute" bottom={10} right={10}>
                                    <Badge size="xs" variant="filled" color="dark.4" leftSection={<IconMaximize size={10} />}>Zoom</Badge>
                                </Box>
                            </Box>
                        </Card>
                    </Grid.Col>}
                </Grid>
            </Stack>
            {hasImages && <Modal opened={opened} onClose={() => setOpened(false)} size="lg" centered title={`Post ${post.id} image ${currentImageIndex + 1}`}>
                <Image src={currentImage.url} alt={`Post ${post.id} image ${currentImageIndex + 1} enlarged`} fit="contain" mah="80vh" />
                {images.length > 1 && <Group justify="center" mt="sm">
                    <ActionIcon onClick={previousImage} aria-label="Previous image"><IconChevronLeft size={20} /></ActionIcon>
                    <Text>{currentImageIndex + 1} / {images.length}</Text>
                    <ActionIcon onClick={nextImage} aria-label="Next image"><IconChevronRight size={20} /></ActionIcon>
                </Group>}
            </Modal>}
        </Paper>
    );
};

const DetailItem = ({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) => (
    <Box>
        <Group gap={4} mb={2}>
            {icon && <Text c="dimmed" span>{icon}</Text>}
            <Text size="xs" c="dimmed" fw={600} tt="uppercase" lts={0.5}>{label}</Text>
        </Group>
        <Text size="sm" fw={500}>{value}</Text>
    </Box>
);
