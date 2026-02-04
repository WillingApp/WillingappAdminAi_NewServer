import React from 'react';
import { Group, Text, Avatar, Box } from '@mantine/core';

interface HeaderProps {
    userName: string;
}

const Header: React.FC<HeaderProps> = ({ userName }) => {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <Group justify="space-between" h="100%" px="md">
            <Box>
                <Text size="lg" fw={700}>WillingApp Admin</Text>
            </Box>
            <Group>
                <Text fw={500} visibleFrom="xs">
                    Welcome {userName}, {getGreeting()}
                </Text>
                <Avatar radius="xl" color="blue" />
            </Group>
        </Group>
    );
};

export default Header;
