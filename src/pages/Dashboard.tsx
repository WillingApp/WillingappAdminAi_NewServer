import React from 'react';
import { Title, Text, Card } from '@mantine/core';

const Dashboard: React.FC = () => (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={2} mb="md">Dashboard</Title>
        <Text>Welcome to the Dashboard overview.</Text>
    </Card>
);

export default Dashboard;
