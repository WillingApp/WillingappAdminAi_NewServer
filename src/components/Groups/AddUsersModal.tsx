import React, { useState } from 'react';
import { Modal, Tabs, TextInput, Switch, Button, Stack, Group, FileButton, Text, Box, Table } from '@mantine/core';
import { IconUserPlus, IconFileSpreadsheet, IconUpload, IconTrash } from '@tabler/icons-react';
import groupService from '../../services/groupService';
import { AddUserPayload } from '../../services/apiTypes';

interface AddUsersModalProps {
    opened: boolean;
    onClose: () => void;
    groupId: number;
    onSuccess: () => void;
}

export const AddUsersModal: React.FC<AddUsersModalProps> = ({ opened, onClose, groupId, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [csvUsers, setCsvUsers] = useState<AddUserPayload[]>([]);
    const [activeTab, setActiveTab] = useState<string | null>('single');

    const [singleUser, setSingleUser] = useState<AddUserPayload>({
        userId: 0,
        phone: '',
        isAdmin: false,
    });
    const [error, setError] = useState<string | null>(null);

    const handleSingleChange = (name: keyof AddUserPayload, value: any) => {
        setSingleUser(prev => ({ ...prev, [name]: value }));
        if (error) setError(null);
    };

    const handleSingleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (singleUser.userId <= 0) {
            setError('User ID is required');
            return;
        }

        setLoading(true);
        try {
            await groupService.addUsersToGroup(groupId, [singleUser]);
            setSingleUser({ userId: 0, phone: '', isAdmin: false });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to add user:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCsvUpload = (file: File | null) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n');
            const newUsers: AddUserPayload[] = [];

            const startIndex = lines[0].toLowerCase().includes('userid') ? 1 : 0;

            for (let i = startIndex; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const [userId, phone, isAdmin] = line.split(',').map(s => s.trim());
                if (userId && !isNaN(parseInt(userId, 10))) {
                    newUsers.push({
                        userId: parseInt(userId, 10),
                        phone: phone || '',
                        isAdmin: isAdmin?.toLowerCase() === 'true' || isAdmin === '1',
                    });
                }
            }
            setCsvUsers(newUsers);
        };
        reader.readAsText(file);
    };

    const handleBatchSubmit = async () => {
        if (csvUsers.length === 0) return;
        setLoading(true);
        try {
            await groupService.addUsersToGroup(groupId, csvUsers);
            setCsvUsers([]);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to add batch users:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Add Users to Group" centered size="lg">
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List mb="md">
                    <Tabs.Tab value="single" leftSection={<IconUserPlus size={16} />}>
                        Single User
                    </Tabs.Tab>
                    <Tabs.Tab value="batch" leftSection={<IconFileSpreadsheet size={16} />}>
                        CSV Upload
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="single">
                    <form onSubmit={handleSingleSubmit}>
                        <Stack>
                            <TextInput
                                label="User ID"
                                placeholder="Enter User ID"
                                required
                                type="number"
                                value={singleUser.userId || ''}
                                onChange={(e) => handleSingleChange('userId', parseInt(e.currentTarget.value, 10))}
                                error={error}
                            />
                            <TextInput
                                label="Phone"
                                placeholder="Enter phone number"
                                value={singleUser.phone}
                                onChange={(e) => handleSingleChange('phone', e.currentTarget.value)}
                            />
                            <Switch
                                label="Is Admin"
                                checked={singleUser.isAdmin}
                                onChange={(e) => handleSingleChange('isAdmin', e.currentTarget.checked)}
                            />
                            <Group justify="flex-end" mt="md">
                                <Button variant="outline" onClick={onClose} disabled={loading}>
                                    Cancel
                                </Button>
                                <Button type="submit" loading={loading}>
                                    Add User
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                </Tabs.Panel>

                <Tabs.Panel value="batch">
                    <Stack>
                        <Box p="md" style={{ border: '1px dashed #ced4da', borderRadius: '8px' }}>
                            <Group justify="center" gap="xs">
                                <FileButton onChange={handleCsvUpload} accept=".csv">
                                    {(props) => (
                                        <Button {...props} variant="light" leftSection={<IconUpload size={16} />}>
                                            Upload CSV File
                                        </Button>
                                    )}
                                </FileButton>
                                <Text size="sm" c="dimmed">Format: userId, phone, isAdmin</Text>
                            </Group>
                        </Box>

                        {csvUsers.length > 0 && (
                            <>
                                <Box style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    <Table verticalSpacing="xs">
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th>User ID</Table.Th>
                                                <Table.Th>Phone</Table.Th>
                                                <Table.Th>Admin</Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {csvUsers.map((user, idx) => (
                                                <Table.Tr key={idx}>
                                                    <Table.Td>{user.userId}</Table.Td>
                                                    <Table.Td>{user.phone}</Table.Td>
                                                    <Table.Td>{user.isAdmin ? 'Yes' : 'No'}</Table.Td>
                                                </Table.Tr>
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                </Box>
                                <Group justify="space-between">
                                    <Button variant="subtle" color="red" leftSection={<IconTrash size={16} />} onClick={() => setCsvUsers([])}>
                                        Clear List ({csvUsers.length})
                                    </Button>
                                    <Button onClick={handleBatchSubmit} loading={loading}>
                                        Add {csvUsers.length} Users
                                    </Button>
                                </Group>
                            </>
                        )}

                        <Group justify="flex-end" mt="md">
                            <Button variant="outline" onClick={onClose} disabled={loading}>
                                Cancel
                            </Button>
                        </Group>
                    </Stack>
                </Tabs.Panel>
            </Tabs>
        </Modal>
    );
};
