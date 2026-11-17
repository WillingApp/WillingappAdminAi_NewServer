import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Title, Card, Alert, Badge, Button, Group, Text, ActionIcon, Tooltip, Modal, Stack } from '@mantine/core';
import { IconPhoto, IconTrash, IconLock } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import requestService, { Post } from '../services/requestService';
import { useApi } from '../hooks/useApi';
import { GenericTable, ColumnDef, useTablePagination } from '../components/GenericTable';
import { RequestDetailExpansion } from '../components/Requests/RequestDetailExpansion';
import { useTableSearch } from '../context/TableSearchContext';
import { useMetadata } from '../context/MetadataContext';
import './css/Requests.css';

const ROW_HEIGHT = 52;
const INTERNAL_OFFSET = 120;
const CLOSE_UNAVAILABLE = 'Closing posts is unavailable in the admin API.';

function formatDate(value: string | null): string {
    if (!value || !Number.isFinite(Date.parse(value))) return '-';
    return new Date(value).toLocaleString();
}

function locationName(post: Post): string {
    const names = post.place?.city?.names;
    return names?.find(name => name.languageId === 1)?.name || names?.[0]?.name || '-';
}

const Requests: React.FC = () => {
    const { page, setPage, take, skip, containerRef, ready } = useTablePagination(ROW_HEIGHT, INTERNAL_OFFSET);
    const searchContext = useTableSearch();
    const searchTerm = searchContext?.searchTerm || '';
    const [debouncedSearch] = useDebouncedValue(searchTerm, 500);
    const { data, loading, error, execute } = useApi(requestService.getRequests);
    const { getTranslation } = useMetadata();
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const deletingRef = useRef(false);

    useEffect(() => {
        if (!searchContext) return;
        searchContext.setIsVisible(true);
        searchContext.setPlaceholder('Search requests...');
        return () => {
            searchContext.setIsVisible(false);
            searchContext.clearSearch();
        };
        // The context exposes stable setter functions.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchContext?.setIsVisible, searchContext?.setPlaceholder, searchContext?.clearSearch]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, setPage]);

    const loadData = useCallback(() => {
        if (!ready) return;
        void execute({
            take,
            skip,
            Filter: debouncedSearch ? { Search: { SearchTerm: debouncedSearch } } : undefined,
        }).catch(() => {
            // useApi exposes the failure in the screen.
        });
    }, [execute, take, skip, debouncedSearch, ready]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const closeDeleteModal = () => {
        if (deletingRef.current) return;
        setDeleteModalOpen(false);
        setDeleteError(null);
    };

    const confirmDelete = async () => {
        if (!selectedPost || deletingRef.current) return;
        const postId = selectedPost.id;
        deletingRef.current = true;
        setDeleting(true);
        setDeleteError(null);
        try {
            await requestService.deletePost(postId);
            setDeleteModalOpen(false);
            notifications.show({ title: 'Post deleted', message: `Post #${postId} was deleted.`, color: 'green' });
            if (page > 1 && data?.data.items.length === 1) {
                setPage(page - 1);
            } else {
                loadData();
            }
        } catch (deleteFailure) {
            setDeleteError(deleteFailure instanceof Error ? deleteFailure.message : 'Could not delete the post.');
        } finally {
            deletingRef.current = false;
            setDeleting(false);
        }
    };

    const columns = useMemo<ColumnDef<Post>[]>(() => [
        { header: 'ID', key: 'id' },
        {
            header: 'Images', key: 'images',
            render: item => item.images.length > 0 ? (
                <Group gap={4}>
                    <IconPhoto size={16} color="var(--mantine-color-blue-filled)" />
                    <Text size="xs" fw={700} c="blue">{item.images.length}</Text>
                </Group>
            ) : '-',
        },
        { header: 'Publisher', key: 'user', render: item => item.user?.name || `#${item.userId}` },
        { header: 'Group', key: 'group', render: item => item.group?.name || 'No group' },
        { header: 'Category', key: 'categoryId', render: item => getTranslation('categories', item.categoryId) },
        { header: 'Content', key: 'content', render: item => <div className="Requests-contentCell">{item.content || '-'}</div> },
        { header: 'City Name', key: 'place', render: locationName },
        { header: 'Created At', key: 'creationTime', render: item => formatDate(item.creationTime) },
        { header: 'Expire Date', key: 'expirationTime', render: item => formatDate(item.expirationTime) },
        {
            header: 'Status', key: 'statusId',
            render: item => <Badge color={item.isActive ? 'green' : 'gray'} variant="outline" size="sm">
                {getTranslation('postStatuses', item.statusId)}
            </Badge>,
        },
        {
            header: 'Actions', key: 'actions',
            render: item => <Group gap="xs">
                <Tooltip label={CLOSE_UNAVAILABLE} withArrow>
                    <span tabIndex={0} aria-disabled="true" onClick={event => event.stopPropagation()}>
                        <ActionIcon disabled aria-label="Close request unavailable" variant="light" color="blue">
                            <IconLock size={18} />
                        </ActionIcon>
                    </span>
                </Tooltip>
                <Tooltip label="Delete post" withArrow>
                    <ActionIcon aria-label={`Delete post #${item.id}`} variant="light" color="red" disabled={deleting}
                        onClick={event => {
                            event.stopPropagation();
                            setDeleteError(null);
                            setSelectedPost(item);
                            setDeleteModalOpen(true);
                        }}>
                        <IconTrash size={18} />
                    </ActionIcon>
                </Tooltip>
            </Group>,
        },
    ], [getTranslation, deleting]);

    const totalItems = data?.data.total ?? 0;

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder className="Requests-card" flex={1}>
            <Group justify="space-between" mb="md">
                <Title order={2}>Requests Management</Title>
                {!error && data && <Badge size="lg" variant="filled">{totalItems} Total Requests</Badge>}
            </Group>
            {error && <Alert color="red" title="Failed to load requests" mb="md">
                <Text mb="xs">{error}</Text>
                <Button size="xs" variant="light" onClick={loadData}>Retry</Button>
            </Alert>}
            <div className="Requests-tableContainer" ref={containerRef}>
                {!error && <GenericTable<Post>
                    data={data?.data.items || []}
                    total={totalItems}
                    columns={columns}
                    loading={loading || !ready}
                    page={page}
                    pageSize={take}
                    onPageChange={setPage}
                    ExpansionComponent={RequestDetailExpansion}
                    emptyMessage="No requests found."
                />}
            </div>
            <Modal opened={deleteModalOpen} onClose={closeDeleteModal} title="Delete post" centered
                onExitTransitionEnd={() => { if (!deleteModalOpen) setSelectedPost(null); }}
                closeOnClickOutside={!deleting} closeOnEscape={!deleting} withCloseButton={!deleting}>
                <Stack gap="md">
                    <Text>Delete post #{selectedPost?.id}? This action cannot be undone.</Text>
                    {selectedPost?.content && <Text size="sm" c="dimmed" lineClamp={3}>{selectedPost.content}</Text>}
                    {deleteError && <Alert color="red" title="Deletion failed">{deleteError}</Alert>}
                    <Group justify="flex-end">
                        <Button variant="default" onClick={closeDeleteModal} disabled={deleting}>Cancel</Button>
                        <Button color="red" aria-label="Confirm delete post" loading={deleting} onClick={() => void confirmDelete()}>
                            Delete post
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Card>
    );
};

export default Requests;
