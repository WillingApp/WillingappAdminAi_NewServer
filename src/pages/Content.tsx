import React from 'react';
import { Title, Text, Card } from '@mantine/core';

const Content: React.FC = () => (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={2} mb="md">Content Management</Title>
        <Text>Edit and manage site content.</Text>
    </Card>
);

export default Content;
