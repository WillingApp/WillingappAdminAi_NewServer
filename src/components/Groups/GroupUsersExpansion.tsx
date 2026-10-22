import React, { useState } from 'react';
import { Table, Title, Badge, Group, Text, Box, ActionIcon, Button, Tooltip } from '@mantine/core';
import { IconTrash, IconUserPlus } from '@tabler/icons-react';
import { Group as GroupType } from '../../services/apiTypes';
import groupService from '../../services/groupService';
import { AddUsersModal } from './AddUsersModal';

interface GroupUsersExpansionProps {
    data: GroupType;
}

export const GroupUsersExpansion: React.FC<GroupUsersExpansionProps> = ({ data }) => {
    const [addUsersOpened, setAddUsersOpened] = useState(false);
    const [loading, setLoading] = useState<number | null>(null);

    const handleRemoveUser = async (userId: number) => {
        if (!window.confirm('Are you sure you want to remove this user from the group?')) return;

        setLoading(userId);
        try {
            await groupService.removeUserFromGroup(data.id, userId);
            alert('User removed successfully. Please refresh to see changes.');
        } catch (error) {
            console.error('Failed to remove user:', error);
            alert('Failed to remove user.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <Box p="md" bg="gray.0" style={{ borderRadius: '4px' }}>
            <Group justify="space-between" mb="xs">
                <Title order={5}>Group Users ({data.users.length})</Title>
                <Button
                    size="compact-sm"
                    variant="light"
                    leftSection={<IconUserPlus size={14} />}
                    onClick={() => setAddUsersOpened(true)}
                >
                    Add Users
                </Button>
            </Group>
            {data.description && <Text size="sm" mb="xs">{data.description}</Text>}
            <Text size="sm" mb="xs">קישור הקבוצה: {data.linkUrl || 'אין'}</Text>

            {data.users.length > 0 ? (
                <Table variant="vertical" withTableBorder withColumnBorders={false} verticalSpacing="xs">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>User ID</Table.Th>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Phone</Table.Th>
                            <Table.Th>Admin</Table.Th>
                            <Table.Th style={{ width: 80 }}>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {data.users.map((user) => (
                            <Table.Tr key={user.userId}>
                                <Table.Td>{user.userId}</Table.Td>
                                <Table.Td>{user.name || '-'}</Table.Td>
                                <Table.Td>{user.phone || '-'}</Table.Td>
                                <Table.Td>
                                    {user.isAdmin ? (
                                        <Badge color="blue" variant="filled" size="sm">Admin</Badge>
                                    ) : (
                                        <Text size="sm" c="dimmed">Member</Text>
                                    )}
                                </Table.Td>
                                <Table.Td>
                                    <Tooltip label="Remove user from group">
                                        <ActionIcon
                                            color="red"
                                            variant="subtle"
                                            onClick={() => handleRemoveUser(user.userId)}
                                            loading={loading === user.userId}
                                        >
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            ) : (
                <Text size="sm" c="dimmed" py="xs">No users in this group.</Text>
            )}

            {addUsersOpened && (
                <AddUsersModal
                    opened={addUsersOpened}
                    onClose={() => setAddUsersOpened(false)}
                    groupId={data.id}
                    onSuccess={() => {
                        alert('Users added successfully. Please refresh to see changes.');
                    }}
                />
            )}
        </Box>
    );
};
