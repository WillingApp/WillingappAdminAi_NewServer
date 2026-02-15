import React from 'react';
import { Title, Text, Card } from '@mantine/core';

const Reports: React.FC = () => (
    <Card
        shadow="sm"
        padding="lg"
        radius="md"
        withBorder
        flex={1}
        style={{ minHeight: 'calc(100vh - 150px)' }} // Extreme test to force height
    >
        <Title order={2} mb="md">Reports</Title>
        <Text>View and generate system reports.</Text>
    </Card>
);

export default Reports;
