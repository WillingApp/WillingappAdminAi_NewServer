import React, { useEffect, useState } from 'react';
import { Title, Card, Tabs, TextInput, PasswordInput, Button, Stack, Group, Text, Badge, Select, Alert, Modal } from '@mantine/core';
import { IconUsers, IconUser, IconUserPlus, IconLock, IconSearch } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { useAuth } from '../context/AuthContext';
import adminService, { AdminUser } from '../services/adminService';
import { GenericTable, ColumnDef } from '../components/GenericTable';
import { notifications } from '@mantine/notifications';
import './css/Settings.css';

const PAGE_SIZE = 10;
const emptyAdmin = { name: '', username: '', password: '' };
const messageOf = (error: unknown) => error instanceof Error ? error.message : 'The request could not be completed.';

const Settings: React.FC = () => {
    const { user: authUser } = useAuth();
    const [activeTab, setActiveTab] = useState<string | null>('admins');
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch] = useDebouncedValue(search.trim(), 300);
    const [status, setStatus] = useState<string | null>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [revision, setRevision] = useState(0);
    const [newAdmin, setNewAdmin] = useState(emptyAdmin);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => { setPage(1); }, [debouncedSearch, status]);

    useEffect(() => {
        let disposed = false;
        setLoading(true);
        setError(null);

        const loadAdmins = async () => {
            // Skip the mount discarded by StrictMode before starting a request.
            if (disposed) return;
            try {
                const result = await adminService.getAdmins({
                    take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE, search: debouncedSearch,
                    isActive: status === 'all' ? undefined : status === 'active',
                });
                if (disposed) return;
                const lastPage = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
                if (page > lastPage) { setPage(lastPage); return; }
                setAdmins(result.items);
                setTotal(result.total);
            } catch (err) {
                if (!disposed) {
                    setAdmins([]);
                    setTotal(0);
                    setError(messageOf(err));
                }
            } finally {
                if (!disposed) setLoading(false);
            }
        };

        void Promise.resolve().then(loadAdmins);
        // Pending reads may finish, but cannot update a newer view or an unmounted page.
        return () => { disposed = true; };
    }, [page, debouncedSearch, status, revision]);

    const handleCreateAdmin = async (event: React.FormEvent) => {
        event.preventDefault();
        if (creating) return;
        const payload = { name: newAdmin.name.trim(), username: newAdmin.username.trim(), password: newAdmin.password };
        if (!payload.name || !payload.username || !payload.password.trim()) {
            setCreateError('Name, username, and password are required.');
            return;
        }
        setCreating(true);
        setCreateError(null);
        try {
            await adminService.createAdmin(payload);
            setNewAdmin(emptyAdmin);
            setSearch('');
            setStatus('all');
            setPage(1);
            setRevision(value => value + 1);
            setActiveTab('admins');
            notifications.show({ title: 'Administrator created', message: 'The account was created successfully.', color: 'green' });
        } catch (err) {
            setCreateError(messageOf(err));
        } finally {
            setCreating(false);
            setNewAdmin(value => ({ ...value, password: '' }));
        }
    };

    const handleSetActive = async () => {
        if (!selectedAdmin || updating) return;
        setUpdating(true);
        try {
            await adminService.setActive(selectedAdmin.id, !selectedAdmin.isActive);
            notifications.show({ title: 'Administrator updated', message: `Account ${selectedAdmin.isActive ? 'deactivated' : 'activated'} successfully.`, color: 'green' });
            setSelectedAdmin(null);
            setRevision(value => value + 1);
        } catch (err) {
            notifications.show({ title: 'Unable to update administrator', message: messageOf(err), color: 'red' });
        } finally {
            setUpdating(false);
        }
    };

    const columns: ColumnDef<AdminUser>[] = [
        { header: 'ID', key: 'id' },
        { header: 'Name', key: 'name' },
        { header: 'Username', key: 'username' },
        { header: 'Status', key: 'isActive', render: item => <Badge color={item.isActive ? 'green' : 'gray'}>{item.isActive ? 'Active' : 'Inactive'}</Badge> },
        { header: 'Actions', key: 'actions', render: item => (
            <Button size="xs" variant="light" color={item.isActive ? 'red' : 'green'} disabled={loading || updating || item.id === authUser?.userId}
                onClick={() => setSelectedAdmin(item)}>
                {item.isActive ? 'Deactivate' : 'Activate'}
            </Button>
        ) },
    ];
    const ownAdmin = admins.find(admin => admin.id === authUser?.userId);

    return (
        <Stack gap="lg" flex={1} h="100%">
            <Card shadow="sm" padding="lg" radius="md" withBorder flex={1} className="Settings-card">
                <Title order={2} className="Settings-title">Settings</Title>
                <Tabs value={activeTab} onChange={value => {
                    setActiveTab(value);
                    setNewAdmin(admin => ({ ...admin, password: '' }));
                    setCreateError(null);
                }} keepMounted={false} className="Settings-tabs">
                    <Tabs.List mb="md">
                        <Tabs.Tab value="admins" leftSection={<IconUsers size={16} />}>Admin Users</Tabs.Tab>
                        <Tabs.Tab value="profile" leftSection={<IconUser size={16} />}>My Account</Tabs.Tab>
                        <Tabs.Tab value="create" disabled={creating} leftSection={<IconUserPlus size={16} />}>Create Admin</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="admins" className="Settings-tabsPanel">
                        <Group mb="md" align="end">
                            <TextInput label="Search administrators" placeholder="Search name or username" leftSection={<IconSearch size={16} />}
                                value={search} onChange={event => setSearch(event.currentTarget.value)} />
                            <Select label="Status" value={status} allowDeselect={false} onChange={setStatus}
                                data={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
                            <Button variant="outline" onClick={() => setRevision(value => value + 1)} loading={loading}>Refresh</Button>
                            <Badge>{total} administrators</Badge>
                        </Group>
                        {error ? <Alert color="red" title="Unable to load administrators">{error}</Alert> : (
                            <GenericTable data={admins} columns={columns} total={total} loading={loading} page={page} pageSize={PAGE_SIZE}
                                onPageChange={setPage} emptyMessage="No administrators found." />
                        )}
                    </Tabs.Panel>
                    <Tabs.Panel value="profile" className="Settings-tabsPanel">
                        <Stack gap="sm" className="Settings-formStack">
                            <Title order={4}>My Account</Title>
                            <Text>Name: {ownAdmin?.name || authUser?.name}</Text>
                            <Text>Username: {ownAdmin?.username || authUser?.username}</Text>
                            <Text>Administrator ID: {authUser?.userId}</Text>
                        </Stack>
                    </Tabs.Panel>
                    <Tabs.Panel value="create" className="Settings-tabsPanel">
                        <form onSubmit={handleCreateAdmin} className="Settings-formStack">
                            <Stack gap="md">
                                <Title order={4}>Create New Administrator</Title>
                                {createError && <Alert color="red" title="Unable to create administrator">{createError}</Alert>}
                                <TextInput label="Name" required maxLength={50} value={newAdmin.name} disabled={creating}
                                    onChange={event => setNewAdmin({ ...newAdmin, name: event.currentTarget.value })} />
                                <TextInput label="Username" required maxLength={50} autoComplete="off" value={newAdmin.username} disabled={creating}
                                    onChange={event => setNewAdmin({ ...newAdmin, username: event.currentTarget.value })} />
                                <PasswordInput label="Password" required maxLength={50} autoComplete="new-password" leftSection={<IconLock size={16} />}
                                    value={newAdmin.password} disabled={creating} onChange={event => setNewAdmin({ ...newAdmin, password: event.currentTarget.value })} />
                                <Button type="submit" loading={creating} className="Settings-saveButton">Create Admin</Button>
                            </Stack>
                        </form>
                    </Tabs.Panel>
                </Tabs>
            </Card>
            <Modal opened={selectedAdmin !== null} onClose={() => { if (!updating) setSelectedAdmin(null); }}
                closeOnClickOutside={!updating} closeOnEscape={!updating} withCloseButton={!updating}
                title={`${selectedAdmin?.isActive ? 'Deactivate' : 'Activate'} administrator`}>
                <Stack>
                    <Text>{selectedAdmin?.isActive ? 'Deactivate' : 'Activate'} {selectedAdmin?.name} ({selectedAdmin?.username})?</Text>
                    <Group justify="flex-end">
                        <Button variant="default" disabled={updating} onClick={() => setSelectedAdmin(null)}>Cancel</Button>
                        <Button color={selectedAdmin?.isActive ? 'red' : 'green'} loading={updating} onClick={handleSetActive}>
                            {selectedAdmin?.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
};

export default Settings;
