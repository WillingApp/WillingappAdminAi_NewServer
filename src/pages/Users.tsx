import React, { useEffect } from 'react';
import { Title, Text, Card, Loader, Stack, Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import userService from '../services/userService';
import { useApi } from '../hooks/useApi';

const Users: React.FC = () => {
    const { data, loading, error, execute } = useApi(userService.getUsers);

    useEffect(() => {
        execute({ take: 25, skip: 0 });
    }, [execute]);

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={2} mb="md">Users Management</Title>

            {loading && (
                <Stack align="center" py="xl">
                    <Loader size="md" />
                    <Text size="sm" c="dimmed">Fetching users...</Text>
                </Stack>
            )}

            {error && (
                <Alert variant="light" color="red" title="Error" icon={<IconInfoCircle />}>
                    {error}
                </Alert>
            )}

            {!loading && !error && data && (
                <Stack>
                    <Text>Manage your application users here.</Text>
                    <Alert variant="light" color="blue" title="API Result" icon={<IconInfoCircle />}>
                        Found {data.total} users.
                    </Alert>
                </Stack>
            )}

            {!loading && !error && !data && (
                <Text>No user data available.</Text>
            )}
        </Card>
    );
};

export default Users;

