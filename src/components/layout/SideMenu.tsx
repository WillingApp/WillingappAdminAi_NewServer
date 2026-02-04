import React from 'react';
import { NavLink, Stack, Button, Box } from '@mantine/core';
import {
    IconLayoutDashboard,
    IconUsers,
    IconSettings,
    IconFileText,
    IconLogout,
    IconGitPullRequest,
    IconFileCode
} from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SideMenu: React.FC = () => {
    const location = useLocation();
    const { logout } = useAuth();

    const links = [
        { label: 'Dashboard', icon: IconLayoutDashboard, path: '/' },
        { label: 'Users', icon: IconUsers, path: '/users' },
        { label: 'Requests', icon: IconGitPullRequest, path: '/requests' },
        { label: 'Reports', icon: IconFileText, path: '/reports' },
        { label: 'Content', icon: IconFileCode, path: '/content' },
        { label: 'Settings', icon: IconSettings, path: '/settings' },
    ];

    return (
        <Box p="md" h="100%" display="flex" style={{ flexDirection: 'column' }}>
            <Stack gap="xs" style={{ flex: 1 }}>
                {links.map((link) => (
                    <NavLink
                        key={link.path}
                        label={link.label}
                        leftSection={<link.icon size="1rem" stroke={1.5} />}
                        component={Link}
                        to={link.path}
                        active={location.pathname === link.path}
                    />
                ))}
            </Stack>

            <Box pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                <Button
                    variant="light"
                    color="red"
                    fullWidth
                    leftSection={<IconLogout size="1rem" />}
                    onClick={logout}
                >
                    Logout
                </Button>
            </Box>
        </Box>
    );
};

export default SideMenu;
