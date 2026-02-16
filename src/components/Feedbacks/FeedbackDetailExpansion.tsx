import React, { useState } from 'react';
import {
    Text, Box, Paper, Stack, Card, Group, SimpleGrid,
    Divider, Title, Textarea, Button
} from '@mantine/core';
import {
    IconInfoCircle, IconUser, IconMessage, IconHelp,
    IconSend, IconCheck
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Feedback } from '../../services/apiTypes';
import feedbackService from '../../services/feedbackService';
import '../../pages/css/Freedbacks.css';

interface FeedbackDetailExpansionProps {
    data: Feedback;
    onStatusUpdate?: () => void;
}

export const FeedbackDetailExpansion: React.FC<FeedbackDetailExpansionProps> = ({ data, onStatusUpdate }) => {
    const [answer, setAnswer] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { feedback, admin } = data;

    const handleSendAnswer = async () => {
        if (!answer.trim()) return;
        setIsSending(true);
        try {
            // Hardcoded admin ID 1 for now
            const success = await feedbackService.resolveFeedback(feedback.id, answer, 1);
            if (success) {
                notifications.show({
                    title: 'Success',
                    message: 'Answer sent and status updated to closed.',
                    color: 'green',
                    icon: <IconCheck size={16} />
                });
                if (onStatusUpdate) onStatusUpdate();
            }
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to send answer.',
                color: 'red'
            });
        } finally {
            setIsSending(false);
        }
    };

    const isOpen = feedback?.status === 1;

    if (!feedback) {
        return (
            <Paper p="lg" withBorder radius="md" className="FeedbackExpansion-container">
                <Text c="red">Error: Feedback data is missing or malformed.</Text>
            </Paper>
        );
    }

    return (
        <Paper p="lg" withBorder radius="md" className="FeedbackExpansion-container">
            <Stack gap="xl">
                {/* Header Section */}
                <Group justify="space-between" align="center">
                    <Group gap="sm">
                        <IconHelp
                            size={24}
                            className={isOpen ? "FeedbackExpansion-icon-open" : "FeedbackExpansion-icon-closed"}
                        />
                        <Stack gap={0}>
                            <Title order={4}>Support Request #{feedback.id}</Title>
                            <Text size="sm" c="dimmed">
                                Status: {isOpen ? 'Open' : 'Closed'}
                            </Text>
                        </Stack>
                    </Group>
                </Group>

                <Divider />

                {/* Info Cards */}
                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                    {/* User Card */}
                    <Card withBorder padding="md" radius="md" shadow="sm">
                        <Card.Section withBorder inheritPadding py="xs" className="FeedbackExpansion-section-user">
                            <Group gap="xs">
                                <IconUser size={18} />
                                <Text fw={600} size="sm">User Information</Text>
                            </Group>
                        </Card.Section>
                        <Stack gap="sm" mt="md">
                            <DetailItem label="Name" value={feedback?.name || '-'} />
                            <DetailItem label="Email" value={feedback?.email || '-'} />
                            <DetailItem label="Phone" value={feedback?.phoneNumber || '-'} />
                        </Stack>
                    </Card>

                    {/* Content Card */}
                    <Card withBorder padding="md" radius="md" shadow="sm">
                        <Card.Section withBorder inheritPadding py="xs" className="FeedbackExpansion-section-content">
                            <Group gap="xs">
                                <IconMessage size={18} />
                                <Text fw={600} size="sm">Message Content</Text>
                            </Group>
                        </Card.Section>
                        <Stack gap="sm" mt="md">
                            <Text size="sm">{feedback?.message || '-'}</Text>
                        </Stack>
                    </Card>

                    {/* Metadata Card */}
                    <Card withBorder padding="md" radius="md" shadow="sm">
                        <Card.Section withBorder inheritPadding py="xs" className="FeedbackExpansion-section-metadata">
                            <Group gap="xs">
                                <IconInfoCircle size={18} />
                                <Text fw={600} size="sm">Metadata</Text>
                            </Group>
                        </Card.Section>
                        <Stack gap="sm" mt="md">
                            <DetailItem label="Created At" value={feedback?.creationTime ? new Date(feedback.creationTime).toLocaleString() : '-'} />
                            <DetailItem label="Last Update" value={feedback?.updateTime ? new Date(feedback.updateTime).toLocaleString() : '-'} />
                            <DetailItem
                                label="Handled By"
                                value={admin && admin.id ? `${admin.firstName} ${admin.lastName}` : '-'}
                            />
                        </Stack>
                    </Card>
                </SimpleGrid>

                {/* Answer / Action Section */}
                <Card withBorder padding="md" radius="md">
                    {isOpen ? (
                        <Stack gap="md">
                            <Text fw={600} size="sm">Send Answer</Text>
                            <Textarea
                                placeholder="Type your answer to the user here..."
                                minRows={4}
                                value={answer}
                                onChange={(e) => setAnswer(e.currentTarget.value)}
                            />
                            <Group justify="flex-end">
                                <Button
                                    leftSection={<IconSend size={16} />}
                                    onClick={handleSendAnswer}
                                    loading={isSending}
                                    disabled={!answer.trim()}
                                >
                                    Send Answer
                                </Button>
                            </Group>
                        </Stack>
                    ) : (
                        <Stack gap="xs">
                            <Text fw={600} size="sm">Admin Answer</Text>
                            <Box p="md" className="FeedbackExpansion-adminAnswer">
                                <Text size="sm">{feedback?.answer || 'No answer recorded.'}</Text>
                            </Box>
                        </Stack>
                    )}
                </Card>
            </Stack>
        </Paper>
    );
};

const DetailItem = ({ label, value }: { label: string; value: string | number }) => (
    <Box>
        <Text size="xs" c="dimmed" fw={600} tt="uppercase" lts={0.5} mb={2}>
            {label}
        </Text>
        <Text size="sm" fw={500}>{value}</Text>
    </Box>
);
