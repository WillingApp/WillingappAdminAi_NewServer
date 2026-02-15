import React, { useEffect, useMemo, useState } from 'react';
import { Title, Card, Badge, Group, ThemeIcon, ActionIcon, Tooltip, Button, Text } from '@mantine/core';
import { IconCircleCheck, IconCircleX, IconSend, IconUserOff } from '@tabler/icons-react';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import userService, { User } from '../services/userService';
import { useApi } from '../hooks/useApi';
import { GenericTable, ColumnDef, useTablePagination } from '../components/GenericTable';
import { UserDetailExpansion } from '../components/Users/UserDetailExpansion';
import { SendNotificationModal } from '../components/Users/SendNotificationModal';
import { useTableSearch } from '../context/TableSearchContext';
import { useMetadata } from '../context/MetadataContext';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import './css/Users.css';
const ROW_HEIGHT = 52;
const UI_OFFSET = 350;
const Users: React.FC = () => {
    const { page, setPage, take, skip } = useTablePagination(ROW_HEIGHT, UI_OFFSET);
    const searchContext = useTableSearch();
    const [opened, { open, close }] = useDisclosure(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

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

    const { getTranslation } = useMetadata();

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
            render: (user) => {
                const getStatusColor = (id: number) => {
                    if (id === 1) return 'green';
                    if (id === 2) return 'red';
                    if (id === 3) return 'yellow';
                    return 'gray';
                };
                return (
                    <Badge color={getStatusColor(user.statusId)} variant="outline" size="sm">
                        {getTranslation('userStatuses', user.statusId)}
                    </Badge>
                );
            },
        },
        {
            header: 'Actions',
            key: 'actions',
            render: (user) => (
                <Group gap="xs">
                    <Tooltip label="Send Notification" withArrow position="left">
                        <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent row expansion
                                setSelectedUser(user);
                                open();
                            }}
                        >
                            <IconSend size={18} />
                        </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Block User" withArrow position="right">
                        <ActionIcon
                            variant="light"
                            color="red"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent row expansion
                                const displayName = user.name || user.phone || user.id;
                                modals.openConfirmModal({
                                    title: <Text fw={700}>Block User</Text>,
                                    children: (
                                        <Text size="sm">
                                            Are you sure you want to block <b>{displayName}</b>? This action will prevent the user from accessing the system.
                                        </Text>
                                    ),
                                    labels: { confirm: 'Block User', cancel: 'Cancel' },
                                    confirmProps: { color: 'red' },
                                    onConfirm: async () => {
                                        try {
                                            await userService.blockUser(user.id);
                                            notifications.show({
                                                title: 'User Blocked',
                                                message: `User ${displayName} has been successfully blocked.`,
                                                color: 'green',
                                            });
                                        } catch (error) {
                                            notifications.show({
                                                title: 'Error',
                                                message: 'Failed to block user.',
                                                color: 'red',
                                            });
                                        }
                                    },
                                });
                            }}
                        >
                            <IconUserOff size={18} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            ),
        },
    ], [getTranslation, open]);

    const totalItems = data?.data?.total ?? data?.total ?? 0;

    return (
        <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            className="Users-card"
            flex={1}
        >
            <Group justify="space-between" mb="md">
                <Title order={2}>Users Management</Title>
                <Group>
                    <Button
                        leftSection={<IconSend size={16} />}
                        variant="outline"
                        color="blue"
                        onClick={() => {
                            setSelectedUser(null);
                            open();
                        }}
                    >
                        Send to All
                    </Button>
                    <Badge size="lg" variant="filled">{totalItems} Total Users</Badge>
                </Group>
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

            <SendNotificationModal
                opened={opened}
                onClose={close}
                user={selectedUser}
            />
        </Card>
    );
};

export default Users;


