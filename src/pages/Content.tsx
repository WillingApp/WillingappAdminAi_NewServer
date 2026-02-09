import React, { useState } from 'react';
import { Title, Stack, Paper, Grid, Card } from '@mantine/core';
import LanguageSelector from '../components/content/LanguageSelector';
import TermsOfUseSection from '../components/content/TermsOfUseSection';
import FAQSection from '../components/content/FAQSection';
import './css/Content.css';

const Content: React.FC = () => {
    const [languageId, setLanguageId] = useState<number>(1); // Default to Hebrew

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder className="Content-card">
            <Stack gap="xl">
                {/* Top Section: Link Management + Language Selection */}
                <Grid gutter="xl">
                    <Grid.Col span={{ base: 12, md: 8 }}>
                        <Paper p="md" radius="md" withBorder shadow="sm" style={{ height: '100%' }}>
                            <TermsOfUseSection />
                        </Paper>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Paper p="md" radius="md" withBorder shadow="sm" style={{ height: '100%' }}>
                            <Title order={4} mb="md">Select Language</Title>
                            <LanguageSelector value={languageId} onChange={setLanguageId} />
                        </Paper>
                    </Grid.Col>
                </Grid>

                {/* Bottom Section: FAQ Management */}
                <FAQSection languageId={languageId} />
            </Stack>
        </Card>
    );
};

export default Content;
