import React, { useState } from 'react';
import { Paper, Title, Text, Group, ActionIcon, Stack, Textarea, TextInput, Button, Tooltip } from '@mantine/core';
import { IconEdit, IconTrash, IconArrowsSort, IconCheck, IconX } from '@tabler/icons-react';
import { FAQItem as FAQItemType } from '../../services/contentService';

interface FAQItemProps {
    item: FAQItemType;
    onUpdate: (item: FAQItemType) => void;
    onDelete: (id: number) => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ item, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedItem, setEditedItem] = useState(item);

    const handleSave = () => {
        onUpdate(editedItem);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedItem(item);
        setIsEditing(false);
    };

    return (
        <Paper withBorder p="md" radius="md" mb="md" shadow="xs">
            <Group justify="space-between" align="flex-start" mb="xs">
                <Stack gap={0} flex={1}>
                    {isEditing ? (
                        <TextInput
                            label="Question"
                            value={editedItem.question}
                            onChange={(e) => setEditedItem({ ...editedItem, question: e.currentTarget.value })}
                            mb="sm"
                        />
                    ) : (
                        <Title order={5} c="blue.7">Q: {item.question}</Title>
                    )}
                </Stack>

                <Group gap="xs">
                    {isEditing ? (
                        <>
                            <Tooltip label="Save">
                                <ActionIcon color="green" onClick={handleSave}>
                                    <IconCheck size={18} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Cancel">
                                <ActionIcon color="gray" onClick={handleCancel}>
                                    <IconX size={18} />
                                </ActionIcon>
                            </Tooltip>
                        </>
                    ) : (
                        <>
                            <Tooltip label="Move">
                                <ActionIcon variant="light" color="gray" style={{ cursor: 'grab' }}>
                                    <IconArrowsSort size={18} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Edit">
                                <ActionIcon variant="light" color="blue" onClick={() => setIsEditing(true)}>
                                    <IconEdit size={18} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Delete">
                                <ActionIcon variant="light" color="red" onClick={() => onDelete(item.id)}>
                                    <IconTrash size={18} />
                                </ActionIcon>
                            </Tooltip>
                        </>
                    )}
                </Group>
            </Group>

            {isEditing ? (
                <Textarea
                    label="Answer"
                    value={editedItem.answer}
                    onChange={(e) => setEditedItem({ ...editedItem, answer: e.currentTarget.value })}
                    minRows={3}
                />
            ) : (
                <Text size="sm" pl="xl" style={{ borderLeft: '2px solid var(--mantine-color-blue-1)' }}>
                    {item.answer}
                </Text>
            )}
        </Paper>
    );
};

export default FAQItem;
