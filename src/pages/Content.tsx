import React, { useState } from 'react';
import { Title, Stack, Paper, Grid, Card } from '@mantine/core';
import LanguageSelector from '../components/content/LanguageSelector';
import TermsOfUseSection from '../components/content/TermsOfUseSection';
import FAQSection from '../components/content/FAQSection';

const Content: React.FC = () => {
    const [languageId, setLanguageId] = useState<number>(1); // Default to Hebrew

    return (
        <Stack gap="xl" py="xs">
            {/* Top Section: Link Management + Language Selection */}
            <Grid gutter="xl" align="stretch">
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Card p="md" radius="md" withBorder shadow="sm" h="100%">
                        <TermsOfUseSection />
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Card p="md" radius="md" withBorder shadow="sm" h="100%">
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
