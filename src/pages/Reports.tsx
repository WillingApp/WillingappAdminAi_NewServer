import React from 'react';
import { Title, Text, Card } from '@mantine/core';
import './css/Reports.css';

const Reports: React.FC = () => (
    <Card shadow="sm" padding="lg" radius="md" withBorder flex={1} className="Reports-card">
        <Title order={2} mb="md">Reports</Title>
        <Text>View and generate system reports.</Text>
    </Card>
);

export default Reports;
