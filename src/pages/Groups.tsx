import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Title, Card, Alert, Badge, Group, ThemeIcon, Text, Avatar, Button, ActionIcon, Tooltip } from '@mantine/core';
import { IconCircleCheck, IconCircleX, IconUsers, IconTrash, IconPlus } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import groupService from '../services/groupService';
import { Group as GroupType } from '../services/apiTypes';
import { useApi } from '../hooks/useApi';
import { GenericTable, ColumnDef, useTablePagination } from '../components/GenericTable';
import { GroupUsersExpansion } from '../components/Groups/GroupUsersExpansion';
import { CreateGroupModal } from '../components/Groups/CreateGroupModal';
import { useTableSearch } from '../context/TableSearchContext';
import './css/Groups.css';

const ROW_HEIGHT = 52;
const UI_OFFSET = 350;

const Groups: React.FC = () => {
    const { page, setPage, take, skip } = useTablePagination(ROW_HEIGHT, UI_OFFSET);
    const searchContext = useTableSearch();
    const [createModalOpened, setCreateModalOpened] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Get search term from context or default to empty string
    const searchTerm = searchContext?.searchTerm || '';
    const [debouncedSearch] = useDebouncedValue(searchTerm, 500);

    const { data, loading, error, execute } = useApi(groupService.getGroups);

    const loadData = useCallback(() => {
        void execute({
            take,
            skip,
            Filter: debouncedSearch ? {
                Search: {
                    SearchTerm: debouncedSearch
                }
            } : undefined
        }).catch(() => {
            // useApi exposes the failure in the screen.
        });
    }, [execute, take, skip, debouncedSearch]);

    // Synchronize page-level settings with the global search in header
    useEffect(() => {
        if (searchContext) {
            searchContext.setIsVisible(true);
            searchContext.setPlaceholder('Search groups by name or code...');

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
        loadData();
    }, [loadData]);

    const handleDeleteGroup = useCallback(async (e: React.MouseEvent, groupId: number) => {
        e.stopPropagation(); // Don't trigger row expansion
        if (!window.confirm('Are you sure you want to delete this group?')) return;

        setDeletingId(groupId);
        try {
            await groupService.deleteGroup(groupId);
            loadData();
        } catch (error) {
            console.error('Failed to delete group:', error);
            alert('Failed to delete group.');
        } finally {
            setDeletingId(null);
        }
    }, [loadData]);

    const columns = useMemo<ColumnDef<GroupType>[]>(() => [
        { header: 'ID', key: 'id' },
        {
            header: 'Name',
            key: 'name',
            render: (group) => (
                <Group gap="sm">
                    <Avatar
                        src={group.imageUrl}
                        size={40}
                        radius="xl"
                        bg="gray.1"
                        imageProps={{ className: 'Groups-avatarImage' }}
                    />
                    <Text fz="sm" fw={500}>{group.name}</Text>
                </Group>
            )
        },
        { header: 'Code', key: 'code' },
        {
            header: 'Open for All',
            key: 'isOpenForAll',
            render: (group) => (
                <Group gap="xs">
                    <ThemeIcon color={group.isOpenForAll ? 'green' : 'gray'} size="sm" variant="light">
                        {group.isOpenForAll ? <IconCircleCheck size={14} /> : <IconCircleX size={14} />}
                    </ThemeIcon>
                    <Badge color={group.isOpenForAll ? 'green' : 'gray'} variant="outline" size="sm">
                        {group.isOpenForAll ? 'Yes' : 'No'}
                    </Badge>
                </Group>
            ),
        },
        {
            header: 'Allow Posts',
            key: 'canAddPosts',
            render: (group) => (
                <Group gap="xs">
                    <ThemeIcon color={group.canAddPosts ? 'blue' : 'gray'} size="sm" variant="light">
                        {group.canAddPosts ? <IconCircleCheck size={14} /> : <IconCircleX size={14} />}
                    </ThemeIcon>
                    <Badge color={group.canAddPosts ? 'blue' : 'gray'} variant="outline" size="sm">
                        {group.canAddPosts ? 'Yes' : 'No'}
                    </Badge>
                </Group>
            ),
        },
        {
            header: 'Users',
            key: 'users',
            render: (group) => (
                <Group gap={4}>
                    <IconUsers size={14} color="gray" />
                    <Text size="sm">{group.users.length}</Text>
                </Group>
            ),
        },
        {
            header: 'Actions',
            key: 'actions',
            render: (group) => (
                <Tooltip label="Delete Group">
                    <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={(e) => handleDeleteGroup(e, group.id)}
                        loading={deletingId === group.id}
                    >
                        <IconTrash size={18} />
                    </ActionIcon>
                </Tooltip>
            )
        }
    ], [deletingId, handleDeleteGroup]);

    const totalItems = data?.data?.total ?? 0;

    return (
        <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            className="Groups-card"
            flex={1}
        >
            <Group justify="space-between" mb="md">
                <Group>
                    <Title order={2}>Groups Management</Title>
                    {!error && <Badge size="lg" variant="filled">{totalItems} Total Groups</Badge>}
                </Group>
                <Button
                    leftSection={<IconPlus size={18} />}
                    onClick={() => setCreateModalOpened(true)}
                >
                    Create Group
                </Button>
            </Group>

            {error && <Alert color="red" title="טעינת הקבוצות נכשלה" mb="md">
                <Text mb="xs">{error}</Text>
                <Button size="xs" variant="light" onClick={loadData}>ניסיון חוזר</Button>
            </Alert>}
            <div className="Groups-tableContainer">
                {!error && <GenericTable<GroupType>
                    data={data?.data?.items || []}
                    total={totalItems}
                    columns={columns}
                    loading={loading}
                    page={page}
                    pageSize={take}
                    onPageChange={setPage}
                    ExpansionComponent={GroupUsersExpansion}
                    emptyMessage="No groups found."
                />}
            </div>

            <CreateGroupModal
                opened={createModalOpened}
                onClose={() => setCreateModalOpened(false)}
                onSuccess={loadData}
            />
        </Card>
    );
};

export default Groups;
