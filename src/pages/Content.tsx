import React, { useState } from 'react';
import { Title, Stack, Paper, Grid, Card } from '@mantine/core';
import LanguageSelector from '../components/content/LanguageSelector';
import TermsOfUseSection from '../components/content/TermsOfUseSection';
import FAQSection from '../components/content/FAQSection';
import './css/Content.css';

const Content: React.FC = () => {
    const [languageId, setLanguageId] = useState<number>(1); // Default to Hebrew

    return (
        <Stack gap="xl" py="xs">
            {/* Top Section: Link Management + Language Selection */}
            <Grid gutter="xl" align="stretch">
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card p="md" radius="md" withBorder shadow="sm" className="Content-card">
                        <TermsOfUseSection />
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card p="md" radius="md" withBorder shadow="sm" className="Content-card">
                        <Title order={4} mb="md">Select Language</Title>
                        <LanguageSelector value={languageId} onChange={setLanguageId} />
                    </Card>
                </Grid.Col>
            </Grid>
            {/* Bottom Section: FAQ Management */}
            <Card p="md" radius="md" withBorder shadow="sm">
                <FAQSection languageId={languageId} />
            </Card>
        </Stack>
    );
};

export default Content;
