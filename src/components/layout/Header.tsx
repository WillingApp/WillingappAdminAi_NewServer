import React from 'react';
import { Group, Text, Avatar, Box, TextInput, Button } from '@mantine/core';
import { IconSearch, IconLogout } from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import { useTableSearch } from '../../context/TableSearchContext';

import './Header.css';

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const searchContext = useTableSearch();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <Group justify="space-between" px="md" wrap="nowrap" className="Header-container">
            {/* Left Section: Title & Welcome */}
            <Box className="Header-left">
                <Text size="lg" fw={700} className="Header-text">WillingApp Admin</Text>
                <Text fw={400} className="Header-welcomeText">
                    Welcome {user?.name || 'User'}, {getGreeting()}
                </Text>
            </Box>

            {/* Center Section: Search */}
            <Box className="Header-center">
                {searchContext && searchContext.isVisible && (
                    <TextInput
                        placeholder={searchContext.placeholder || 'Search...'}
                        rightSection={<IconSearch size={18} />}
                        value={searchContext.searchTerm}
                        onChange={(e) => searchContext.setSearchTerm(e.currentTarget.value)}
                        radius="xl"
                        size="md"
                        style={{ width: '100%' }}
                        className="Header-searchInput"
                    />
                )}
            </Box>

            {/* Right Section: Logout */}
            <Box className="Header-right">
                <Button
                    variant="subtle"
                    color="gray"
                    className="Header-logoutBtn"
                    leftSection={<IconLogout size={18} />}
                    onClick={logout}
                >
                    Logout
                </Button>
            </Box>
        </Group>
    );
};

export default Header;

