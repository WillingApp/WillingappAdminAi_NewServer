import React from 'react';
import { Title, Text, Card } from '@mantine/core';

const Settings: React.FC = () => (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={2} mb="md">Settings</Title>
        <Text>Configure your application preferences.</Text>
    </Card>
);

export default Settings;
