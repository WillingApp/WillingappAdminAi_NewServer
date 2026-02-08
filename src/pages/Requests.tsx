import React, { useEffect, useMemo } from 'react';
import { Title, Card, Badge, Group, ThemeIcon } from '@mantine/core';
import { IconCircleCheck, IconCircleX } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import requestService, { Post } from '../services/requestService';
import { useApi } from '../hooks/useApi';
import { GenericTable, ColumnDef, useTablePagination } from '../components/GenericTable';
import { RequestDetailExpansion } from '../components/Requests/RequestDetailExpansion';
import { useTableSearch } from '../context/TableSearchContext';
import './css/Requests.css';

const ROW_HEIGHT = 46;
const UI_OFFSET = 350;

const Requests: React.FC = () => {
    const { page, setPage, take, skip } = useTablePagination(ROW_HEIGHT, UI_OFFSET);
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
        execute({
            take,
            skip,
            Filter: debouncedSearch ? {
                Search: {
                    SearchTerm: debouncedSearch
                }
            } : undefined
        });
    }, [execute, take, skip, debouncedSearch]);

    const columns = useMemo<ColumnDef<Post>[]>(() => [
        { header: 'ID', key: 'id' },
        { header: 'User ID', key: 'userId' },
        { header: 'Category ID', key: 'categoryId' },
        {
            header: 'Content',
            key: 'content',
            render: (item) => (
                <div style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                    <ThemeIcon color={item.statusId === 1 ? 'green' : 'red'} size="sm" variant="light">
                        {item.statusId === 1 ? <IconCircleCheck size={14} /> : <IconCircleX size={14} />}
                    </ThemeIcon>
                    <Badge color={item.statusId === 1 ? 'green' : 'red'} variant="outline" size="sm">
                        {item.statusId === 1 ? 'Active' : 'Inactive'}
                    </Badge>
                </Group>
            ),
        },
    ], []);

    const totalItems = data?.data?.total ?? data?.total ?? 0;

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder className="Requests-card">
            <Group justify="space-between" mb="md">
                <Title order={2}>Requests Management</Title>
                <Badge size="lg" variant="filled">{totalItems} Total Requests</Badge>
            </Group>

            <div className="Requests-tableContainer">
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
