import React from 'react';
import { Title, Text, Card } from '@mantine/core';

const Requests: React.FC = () => (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={2} mb="md">Requests</Title>
        <Text>Review and handle user requests.</Text>
    </Card>
);

export default Requests;
