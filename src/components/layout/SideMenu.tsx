import React from 'react';
import { NavLink, Stack, Button, Box } from '@mantine/core';
import {
    IconLayoutDashboard,
    IconUsers,
    IconSettings,
    IconFileText,
    IconGitPullRequest,
    IconFileCode,
    IconUsersGroup,
    IconHelp
} from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';

const SideMenu: React.FC = () => {
    const location = useLocation();

    const links = [
        { label: 'Dashboard', icon: IconLayoutDashboard, path: '/' },
        { label: 'Users', icon: IconUsers, path: '/users' },
        { label: 'Requests', icon: IconGitPullRequest, path: '/requests' },
        { label: 'Reports', icon: IconFileText, path: '/reports' },
        { label: 'Feedbacks', icon: IconHelp, path: '/feedbacks' },
        { label: 'Groups', icon: IconUsersGroup, path: '/groups' },
        { label: 'Content', icon: IconFileCode, path: '/content' },
    ];

    const settingsLink = { label: 'Settings', icon: IconSettings, path: '/settings' };

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
            <Box mt="auto">
                <NavLink
                    key={settingsLink.path}
                    label={settingsLink.label}
                    leftSection={<settingsLink.icon size="1rem" stroke={1.5} />}
                    component={Link}
                    to={settingsLink.path}
                    active={location.pathname === settingsLink.path}
                />
            </Box>
        </Box >
    );
};

export default SideMenu;
