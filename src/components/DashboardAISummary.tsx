import React, { useEffect, useState, useCallback } from 'react';
import { Paper, Title, Text, Stack, Loader, Center, Alert, Button, Group } from '@mantine/core';
import { IconSparkles, IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import { askGemini } from '../services/gemini-service';
import { DashboardSummaryPrompt } from '../services/SystemPrompt';
import { DashboardData } from '../services/dashboardService';

interface DashboardAISummaryProps {
    data: DashboardData;
}

const DashboardAISummary: React.FC<DashboardAISummaryProps> = ({ data }) => {
    const [summary, setSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const generateSummary = useCallback(async () => {
        if (!data) return;

        setLoading(true);
        setError(null);
        try {
            const userPrompt = JSON.stringify(data);
            const model = "gemini-2.5-flash";
            const result = await askGemini(model, userPrompt, DashboardSummaryPrompt);
            setSummary(result);
        } catch (err) {
            console.error('Failed to generate AI summary:', err);
            setError('לא הצלחנו להפיק סיכום אוטומטי כרגע. אנא נסה שנית מאוחר יותר.');
        } finally {
            setLoading(false);
        }
    }, [data]);

    useEffect(() => {
        generateSummary();
    }, [generateSummary]);

    return (
        <Paper withBorder p="md" radius="md" shadow="sm" pos="relative" style={{ minHeight: rem(150) }}>
            <Group justify="space-between" mb="md">
                <Group gap="xs">
                    <IconSparkles size="1.2rem" color="var(--mantine-color-blue-6)" />
                    <Title order={3} size="h4">AI Insights Summary</Title>
                </Group>
                <Button
                    variant="subtle"
                    size="xs"
                    leftSection={<IconRefresh size="0.8rem" />}
                    onClick={generateSummary}
                    loading={loading}
                >
                    רענן סיכום
                </Button>
            </Group>

            {loading ? (
                <Center h={100}>
                    <Stack align="center" gap="xs">
                        <Loader size="sm" />
                        <Text size="sm" c="dimmed">מנתח נתונים ומפיק תובנות...</Text>
                    </Stack>
                </Center>
            ) : error ? (
                <Alert icon={<IconAlertCircle size="1rem" />} color="red" variant="light">
                    {error}
                </Alert>
            ) : (
                <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {summary}
                </Text>
            )}
        </Paper>
    );
};

// Helper for rem if needed or just use strings
const rem = (v: number) => `${v / 16}rem`;

export default DashboardAISummary;
