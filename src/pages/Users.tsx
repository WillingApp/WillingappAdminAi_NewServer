import React from 'react';
import { Title, Text, Card } from '@mantine/core';

const Users: React.FC = () => (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={2} mb="md">Users Management</Title>
        <Text>Manage your application users here.</Text>
    </Card>
);

export default Users;
