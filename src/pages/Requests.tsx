import React, { useEffect, useMemo, useState } from 'react';
import { Title, Card, Badge, Group, ThemeIcon, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconCircleCheck, IconCircleX, IconPhoto, IconExternalLink, IconTrash, IconLock } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import requestService, { Post } from '../services/requestService';
import { useApi } from '../hooks/useApi';
import { GenericTable, ColumnDef, useTablePagination } from '../components/GenericTable';
import { RequestDetailExpansion } from '../components/Requests/RequestDetailExpansion';
import { useTableSearch } from '../context/TableSearchContext';
import { useMetadata } from '../context/MetadataContext';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import './css/Requests.css';

const ROW_HEIGHT = 52;
const INTERNAL_OFFSET = 120; // Header inside card + Pagination + Spacing
const Requests: React.FC = () => {
    const { page, setPage, take, skip, containerRef, ready } = useTablePagination(ROW_HEIGHT, INTERNAL_OFFSET);
    const searchContext = useTableSearch();

    // Get search term from context or default to empty string
    const searchTerm = searchContext?.searchTerm || '';
    const [debouncedSearch] = useDebouncedValue(searchTerm, 500);

    const { data, loading, error, execute } = useApi(requestService.getRequests);

    // Synchronize page-level settings with the global search in header
    useEffect(() => {
        if (searchContext) {
            searchContext.setIsVisible(true);
            searchContext.setPlaceholder('Search requests...');

            // Clean up when leaving the page
            return () => {
                searchContext.setIsVisible(false);
                searchContext.clearSearch();
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchContext?.setIsVisible, searchContext?.setPlaceholder, searchContext?.clearSearch]);

    // Reset to page 1 when search term changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, setPage]);

    useEffect(() => {
        if (!ready) return;

        execute({
            take,
            skip,
            Filter: debouncedSearch ? {
                Search: {
                    SearchTerm: debouncedSearch
                }
            } : undefined
        });
    }, [execute, take, skip, debouncedSearch, ready]);

    const { getTranslation } = useMetadata();

    const columns = useMemo<ColumnDef<Post>[]>(() => [
        { header: 'ID', key: 'id' },
        {
            header: 'Images',
            key: 'images',
            render: (item) => (
                item.images && item.images.length > 0 ? (
                    <Group gap={4}>
                        <IconPhoto size={16} color="var(--mantine-color-blue-filled)" />
                        <Text size="xs" fw={700} c="blue">{item.images.length}</Text>
                    </Group>
                ) : '-'
            )
        },
        { header: 'User ID', key: 'userId' },
        {
            header: 'Category',
            key: 'categoryId',
            render: (item) => getTranslation('categories', item.categoryId)
        },
        {
            header: 'Content',
            key: 'content',
            render: (item) => (
                <div className="Requests-contentCell">
                    {item.content || '-'}
                </div>
            )
        },
        {
            header: 'City Name',
            key: 'place',
            render: (item) => item.place?.city?.names?.[0]?.name || '-'
        },
        {
            header: 'Created At',
            key: 'creationTime',
            render: (item) => new Date(item.creationTime).toLocaleString(),
        },
        {
            header: 'Expire Date',
            key: 'expirationTime',
            render: (item) => new Date(item.expirationTime).toLocaleString(),
        },
        {
            header: 'Status',
            key: 'statusId',
            render: (item) => (
                <Group gap="xs">
                    <Badge color={item.statusId === 1 ? 'green' : 'red'} variant="outline" size="sm">
                        {getTranslation('postStatuses', item.statusId)}
                    </Badge>
                </Group>
            ),
        },
        {
            header: 'Actions',
            key: 'actions',
            render: (item) => (
                <Group gap="xs">
                    <Tooltip label="Close Request" withArrow>
                        <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={(e) => {
                                e.stopPropagation();
                                modals.openConfirmModal({
                                    title: <Text fw={700}>Close Request</Text>,
                                    children: (
                                        <Text size="sm">
                                            Are you sure you want to close this request?
                                        </Text>
                                    ),
                                    labels: { confirm: 'Close', cancel: 'Cancel' },
                                    confirmProps: { color: 'blue' },
                                    onConfirm: async () => {
                                        try {
                                            await requestService.updateRequestStatus(item.id, 2); // Assuming 2 is Closed
                                            notifications.show({
                                                title: 'Request Closed',
                                                message: 'The request has been successfully closed.',
                                                color: 'green',
                                            });
                                            execute({ take, skip, Filter: debouncedSearch ? { Search: { SearchTerm: debouncedSearch } } : undefined });
                                        } catch (err) {
                                            notifications.show({
                                                title: 'Error',
                                                message: 'Failed to close request.',
                                                color: 'red',
                                            });
                                        }
                                    },
                                });
                            }}
                        >
                            <IconLock size={18} />
                        </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Delete Request" withArrow>
                        <ActionIcon
                            variant="light"
                            color="red"
                            onClick={(e) => {
                                e.stopPropagation();
                                modals.openConfirmModal({
                                    title: <Text fw={700}>Delete Request</Text>,
                                    children: (
                                        <Text size="sm">
                                            Are you sure you want to delete this request? This action cannot be undone.
                                        </Text>
                                    ),
                                    labels: { confirm: 'Delete', cancel: 'Cancel' },
                                    confirmProps: { color: 'red' },
                                    onConfirm: async () => {
                                        try {
                                            await requestService.deleteRequest(item.id);
                                            notifications.show({
                                                title: 'Request Deleted',
                                                message: 'The request has been successfully deleted.',
                                                color: 'green',
                                            });
                                            execute({ take, skip, Filter: debouncedSearch ? { Search: { SearchTerm: debouncedSearch } } : undefined });
                                        } catch (err) {
                                            notifications.show({
                                                title: 'Error',
                                                message: 'Failed to delete request.',
                                                color: 'red',
                                            });
                                        }
                                    },
                                });
                            }}
                        >
                            <IconTrash size={18} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            ),
        },
    ], [getTranslation, execute, take, skip, debouncedSearch]);

    const totalItems = data?.data?.total ?? data?.total ?? 0;

    return (
        <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            className="Requests-card"
            flex={1}
        >
            <Group justify="space-between" mb="md">
                <Title order={2}>Requests Management</Title>
                <Badge size="lg" variant="filled">{totalItems} Total Requests</Badge>
            </Group>

            <div className="Requests-tableContainer" ref={containerRef}>
                <GenericTable<Post>
                    data={data?.data?.items || []}
                    total={totalItems}
                    columns={columns}
                    loading={loading}
                    page={page}
                    pageSize={take}
                    onPageChange={setPage}
                    ExpansionComponent={RequestDetailExpansion}
                    emptyMessage="No requests found."
                />
            </div>
        </Card>
    );
};

export default Requests;
