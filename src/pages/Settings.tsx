import React, { useEffect, useState } from 'react';
import { Title, Card, Tabs, TextInput, PasswordInput, Button, Stack, Group, Text, Badge } from '@mantine/core';
import { IconUsers, IconUser, IconUserPlus, IconAt, IconPhone, IconLock } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import adminService, { AdminUser } from '../services/adminService';
import { GenericTable, ColumnDef } from '../components/GenericTable';
import { notifications } from '@mantine/notifications';
import './css/Settings.css';

const Settings: React.FC = () => {
    const { user: authUser } = useAuth();
    const [activeTab, setActiveTab] = useState<string | null>('admins');
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(false);

    // Profile state
    const [profileName, setProfileName] = useState('');
    const [profileEmail, setProfileEmail] = useState('');
    const [profilePhone, setProfilePhone] = useState('');
    const [profilePassword, setProfilePassword] = useState('');
    const [currentUserAdmin, setCurrentUserAdmin] = useState<AdminUser | null>(null);

    // New Admin state
    const [newAdmin, setNewAdmin] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: ''
    });

    useEffect(() => {
        loadAdmins();
    }, []);

    useEffect(() => {
        if (authUser) {
            // First priority: data from auth session (what came from Login)
            setProfileName(authUser.name || '');
            setProfileEmail(authUser.email || '');
            setProfilePhone(authUser.phone || '');

            // Second priority: supplement with details from admin list if available
            if (admins.length > 0) {
                const admin = admins.find(a => a.email.toLowerCase() === authUser.email.toLowerCase());
                if (admin) {
                    setCurrentUserAdmin(admin);
                    // If auth data is incomplete, use admin list data
                    if (!authUser.name) setProfileName(`${admin.firstName} ${admin.lastName}`);
                    if (!authUser.phone) setProfilePhone(admin.phone);
                }
            }
        }
    }, [authUser, admins]);

    const loadAdmins = async () => {
        setLoading(true);
        try {
            const data = await adminService.getAdmins();
            setAdmins(data);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!currentUserAdmin) return;

        setLoading(true);
        try {
            const parts = profileName.split(' ');
            const firstName = parts[0];
            const lastName = parts.slice(1).join(' ');

            const updates: Partial<AdminUser> = {
                firstName,
                lastName,
                email: profileEmail,
                phone: profilePhone
            };

            if (profilePassword) {
                updates.password = profilePassword;
            }

            await adminService.updateAdmin(currentUserAdmin.id, updates);
            notifications.show({
                title: 'Success',
                message: 'Profile updated successfully',
                color: 'green'
            });
            setProfilePassword(''); // Clear password field after save
            loadAdmins();
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to update profile',
                color: 'red'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async () => {
        if (!newAdmin.firstName || !newAdmin.lastName || !newAdmin.email || !newAdmin.password) {
            notifications.show({
                title: 'Validation Error',
                message: 'Please fill in all required fields (Name, Email, Password)',
                color: 'yellow'
            });
            return;
        }

        setLoading(true);
        try {
            await adminService.createAdmin({
                ...newAdmin,
                status: 1
            });
            notifications.show({
                title: 'Success',
                message: 'Admin created successfully',
                color: 'green'
            });
            setNewAdmin({ firstName: '', lastName: '', email: '', phone: '', password: '' });
            setActiveTab('admins');
            loadAdmins();
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to create admin',
                color: 'red'
            });
        } finally {
            setLoading(false);
        }
    };

    const columns: ColumnDef<AdminUser>[] = [
        { header: 'ID', key: 'id' },
        {
            header: 'Name',
            key: 'firstName',
            render: (item) => `${item.firstName} ${item.lastName}`
        },
        { header: 'Email', key: 'email' },
        { header: 'Phone', key: 'phone' },
        {
            header: 'Status',
            key: 'status',
            render: (item) => (
                <Badge color={item.status === 1 ? 'green' : 'red'}>
                    {item.status === 1 ? 'Active' : 'Inactive'}
                </Badge>
            )
        }
    ];

    return (
        <Stack gap="lg" flex={1} h="100%">
            <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                flex={1}
                className="Settings-card"
            >
                <Title order={2} className="Settings-title">Settings</Title>
                <Tabs
                    value={activeTab}
                    onChange={setActiveTab}
                    flex={1}
                    className="Settings-tabs"
                    styles={{
                        panel: {
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0,
                        }
                    }}
                >
                    <Tabs.List mb="md">
                        <Tabs.Tab value="admins" leftSection={<IconUsers size={16} />}>Admin Users</Tabs.Tab>
                        <Tabs.Tab value="profile" leftSection={<IconUser size={16} />}>My Profile</Tabs.Tab>
                        <Tabs.Tab value="create" leftSection={<IconUserPlus size={16} />}>Create Admin</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="admins" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <GenericTable
                            data={admins}
                            columns={columns}
                            total={admins.length}
                            loading={loading}
                            page={1}
                            pageSize={10}
                            onPageChange={() => { }}
                        />
                    </Tabs.Panel>

                    <Tabs.Panel value="profile" className="Settings-tabsPanel">
                        <Stack gap="md" className="Settings-formStack">
                            <Title order={4}>Update Personal Details</Title>
                            <TextInput
                                label="Full Name"
                                placeholder={currentUserAdmin ? `${currentUserAdmin.firstName} ${currentUserAdmin.lastName}` : "Enter your full name"}
                                value={profileName}
                                onChange={(e) => setProfileName(e.currentTarget.value)}
                            />
                            <TextInput
                                label="Email"
                                placeholder={currentUserAdmin?.email || "Email address"}
                                leftSection={<IconAt size={16} />}
                                value={profileEmail}
                                onChange={(e) => setProfileEmail(e.currentTarget.value)}
                            />
                            <TextInput
                                label="Phone"
                                placeholder={currentUserAdmin?.phone || "Phone number"}
                                leftSection={<IconPhone size={16} />}
                                value={profilePhone}
                                onChange={(e) => setProfilePhone(e.currentTarget.value)}
                            />
                            <PasswordInput
                                label="Update Password"
                                placeholder="Enter new password (optional)"
                                leftSection={<IconLock size={16} />}
                                value={profilePassword}
                                onChange={(e) => setProfilePassword(e.currentTarget.value)}
                            />
                            <Button onClick={handleUpdateProfile} loading={loading} className="Settings-saveButton">Save Changes</Button>
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="create" className="Settings-tabsPanel">
                        <Stack gap="md" className="Settings-formStack">
                            <Title order={4}>Create New Administrator</Title>
                            <Group grow>
                                <TextInput
                                    label="First Name"
                                    required
                                    placeholder="First Name"
                                    value={newAdmin.firstName}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, firstName: e.currentTarget.value })}
                                />
                                <TextInput
                                    label="Last Name"
                                    required
                                    placeholder="Last Name"
                                    value={newAdmin.lastName}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, lastName: e.currentTarget.value })}
                                />
                            </Group>
                            <TextInput
                                label="Email"
                                required
                                placeholder="email@example.com"
                                leftSection={<IconAt size={16} />}
                                value={newAdmin.email}
                                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.currentTarget.value })}
                            />
                            <TextInput
                                label="Phone"
                                placeholder="Phone number"
                                leftSection={<IconPhone size={16} />}
                                value={newAdmin.phone}
                                onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.currentTarget.value })}
                            />
                            <PasswordInput
                                label="Password"
                                required
                                placeholder="Initial password"
                                leftSection={<IconLock size={16} />}
                                value={newAdmin.password}
                                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.currentTarget.value })}
                            />
                            <Button onClick={handleCreateAdmin} loading={loading} className="Settings-saveButton">Create Admin</Button>
                        </Stack>
                    </Tabs.Panel>
                </Tabs>
            </Card>
        </Stack>
    );
};

export default Settings;
