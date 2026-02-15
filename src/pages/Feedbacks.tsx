import React from 'react';
import { Title, Text, Card } from '@mantine/core';
import './css/Freedbacks.css';

const Feedbacks: React.FC = () => (
    <Card shadow="sm" padding="lg" radius="md" withBorder flex={1} className="Freedbacks-card">
        <Title order={2} mb="md">Feedbacks</Title>
        <Text>View and generate Feedbacks/Support.</Text>
    </Card>
);

export default Feedbacks;
