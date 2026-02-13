import React, { useState } from 'react';
import { Modal, Textarea, Button, Stack, Text, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSend } from '@tabler/icons-react';
import userService, { User } from '../../services/userService';

interface SendNotificationModalProps {
    opened: boolean;
    onClose: () => void;
    user: User | null;
}

export const SendNotificationModal: React.FC<SendNotificationModalProps> = ({
    opened,
    onClose,
    user,
}) => {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!message.trim()) return;

        setSending(true);
        try {
            if (user) {
                await userService.sendNotification(user.id, message);
                notifications.show({
                    title: 'Success',
                    message: `Notification sent to ${user.name || user.phone || user.id}`,
                    color: 'green',
                });
            } else {
                await userService.sendBroadcastNotification(message);
                notifications.show({
                    title: 'Success',
                    message: 'Broadcast notification sent to all users',
                    color: 'green',
                });
            }
            setMessage('');
            onClose();
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to send notification',
                color: 'red',
            });
        } finally {
            setSending(false);
        }
    };

    const targetLabel = user ? (user.name || user.phone || user.id) : 'All Users';

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={<Text fw={700}>{user ? 'Send Notification' : 'Broadcast Notification'}</Text>}
            centered
            radius="md"
        >
            <Stack>
                <Text size="sm">
                    Sending notification to: <b>{targetLabel}</b>
                </Text>

                <Textarea
                    placeholder="Enter your message here..."
                    label="Message"
                    minRows={4}
                    value={message}
                    onChange={(event) => setMessage(event.currentTarget.value)}
                    required
                    autosize
                />

                <Group justify="flex-end" mt="md">
                    <Button variant="subtle" onClick={onClose} disabled={sending}>
                        Cancel
                    </Button>
                    <Button
                        leftSection={<IconSend size={16} />}
                        onClick={handleSend}
                        loading={sending}
                        disabled={!message.trim()}
                    >
                        Send
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};
