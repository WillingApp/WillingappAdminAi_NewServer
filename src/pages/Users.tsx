import React, { useEffect, useMemo } from 'react';
import { Title, Card, Badge, Group, ThemeIcon } from '@mantine/core';
import { IconCircleCheck, IconCircleX } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import userService, { User } from '../services/userService';
import { useApi } from '../hooks/useApi';
import { GenericTable, ColumnDef, useTablePagination } from '../components/GenericTable';
import { UserDetailExpansion } from '../components/Users/UserDetailExpansion';
import { useTableSearch } from '../context/TableSearchContext';
import './css/Users.css';

const ROW_HEIGHT = 46;
const UI_OFFSET = 350;

const Users: React.FC = () => {
    const { page, setPage, take, skip } = useTablePagination(ROW_HEIGHT, UI_OFFSET);
    const searchContext = useTableSearch();

    // Get search term from context or default to empty string
    const searchTerm = searchContext?.searchTerm || '';
    const [debouncedSearch] = useDebouncedValue(searchTerm, 500);

    const { data, loading, error, execute } = useApi(userService.getUsers);

    // Synchronize page-level settings with the global search in header
    useEffect(() => {
        if (searchContext) {
            searchContext.setIsVisible(true);
            searchContext.setPlaceholder('Search users by name or phone...');

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

    const columns = useMemo<ColumnDef<User>[]>(() => [
        { header: 'ID', key: 'id' },
        { header: 'Name', key: 'name', render: (user) => user.name || '-' },
        { header: 'Phone', key: 'phone', render: (user) => user.phone || '-' },
        {
            header: 'Created At',
            key: 'creationTime',
            render: (user) => new Date(user.creationTime).toLocaleDateString(),
        },
        {
            header: 'Updated At',
            key: 'updateTime',
            render: (user) => new Date(user.updateTime).toLocaleDateString(),
        },
        {
            header: 'Status',
            key: 'statusId',
            render: (user) => (
                <Group gap="xs">
                    <ThemeIcon color={user.statusId === 1 ? 'green' : 'red'} size="sm" variant="light">
                        {user.statusId === 1 ? <IconCircleCheck size={14} /> : <IconCircleX size={14} />}
                    </ThemeIcon>
                    <Badge color={user.statusId === 1 ? 'green' : 'red'} variant="outline" size="sm">
                        {user.statusId === 1 ? 'Active' : 'Inactive'}
                    </Badge>
                </Group>
            ),
        },
    ], []);

    const totalItems = data?.data?.total ?? data?.total ?? 0;

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder className="Users-card">
            <Group justify="space-between" mb="md">
                <Title order={2}>Users Management</Title>
                <Badge size="lg" variant="filled">{totalItems} Total Users</Badge>
            </Group>

            <div className="Users-tableContainer">
                <GenericTable<User>
                    data={data?.data?.items || []}
                    total={totalItems}
                    columns={columns}
                    loading={loading}
                    page={page}
                    pageSize={take}
                    onPageChange={setPage}
                    ExpansionComponent={UserDetailExpansion}
                    emptyMessage="No users found."
                />
            </div>
        </Card>
    );
};

export default Users;


