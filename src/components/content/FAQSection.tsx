import React, { useState, useEffect } from 'react';
import { Stack, Title, Button, Group, Loader, Text, Center, Modal, TextInput, Textarea, Table, ActionIcon, Tooltip, Paper } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconArrowsSort } from '@tabler/icons-react';
import { useContent } from '../../hooks/useContent';
import { FAQItem } from '../../services/contentService';

interface FAQSectionProps {
    languageId: number;
}

const FAQSection: React.FC<FAQSectionProps> = ({ languageId }) => {
    const { items, loading, create, update, remove } = useContent(languageId);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<FAQItem | null>(null);
    const [newQuestion, setNewQuestion] = useState({ question: '', answer: '' });

    // Debug logging to see exactly what arrives at the component
    useEffect(() => {
        console.log(`[FAQSection] Items for language ${languageId}:`, items);
    }, [items, languageId]);

    const handleCreate = async () => {
        await create({
            ...newQuestion,
            languageId,
            displayOrder: items.length + 1,
        });
        setNewQuestion({ question: '', answer: '' });
        setIsModalOpen(false);
    };

    const handleUpdate = async () => {
        if (editingItem) {
            await update(editingItem);
            setEditingItem(null);
        }
    };

    if (loading) {
        return (
            <Center p="xl">
                <Loader size="lg" />
            </Center>
        );
    }

    return (
        <Stack gap="md">
            <Group justify="space-between" mb="xs">
                <Title order={3}>FAQ Management</Title>
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => setIsModalOpen(true)}
                >
                    Add New Question
                </Button>
            </Group>

            {items.length === 0 ? (
                <Center p="xl" style={{ border: '1px dashed var(--mantine-color-gray-3)', borderRadius: '8px' }}>
                    <Text c="dimmed">No FAQ items found for this language.</Text>
                </Center>
            ) : (
                <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                    <Table striped highlightOnHover verticalSpacing="xs">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th style={{ width: 40 }}>#</Table.Th>
                                <Table.Th>Question</Table.Th>
                                <Table.Th>Answer</Table.Th>
                                <Table.Th style={{ width: 100 }}>Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {items.map((item, index) => (
                                <Table.Tr key={item.id || index}>
                                    <Table.Td>
                                        <Text size="sm" c="dimmed">{item.displayOrder || index + 1}</Text>
                                    </Table.Td>
                                    <Table.Td fw={500}>{item.question || <Text c="red" size="xs">Missing Question</Text>}</Table.Td>
                                    <Table.Td>
                                        <Text size="sm" lineClamp={2}>{item.answer || <Text c="red" size="xs">Missing Answer</Text>}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4} wrap="nowrap">
                                            <Tooltip label="Edit">
                                                <ActionIcon variant="light" color="blue" onClick={() => setEditingItem(item)}>
                                                    <IconEdit size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label="Delete">
                                                <ActionIcon variant="light" color="red" onClick={() => remove(item.id)}>
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Paper>
            )}

            {/* Modal for adding/editing */}
            <Modal
                opened={isModalOpen || !!editingItem}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingItem(null);
                }}
                title={editingItem ? 'Edit FAQ' : 'Add New FAQ'}
            >
                <Stack gap="md">
                    <TextInput
                        label="Question"
                        placeholder="Enter question"
                        value={editingItem ? editingItem.question : newQuestion.question}
                        onChange={(e) => {
                            if (editingItem) setEditingItem({ ...editingItem, question: e.currentTarget.value });
                            else setNewQuestion({ ...newQuestion, question: e.currentTarget.value });
                        }}
                        required
                    />
                    <Textarea
                        label="Answer"
                        placeholder="Enter answer"
                        value={editingItem ? editingItem.answer : newQuestion.answer}
                        onChange={(e) => {
                            if (editingItem) setEditingItem({ ...editingItem, answer: e.currentTarget.value });
                            else setNewQuestion({ ...newQuestion, answer: e.currentTarget.value });
                        }}
                        minRows={4}
                        required
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" color="gray" onClick={() => {
                            setIsModalOpen(false);
                            setEditingItem(null);
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={editingItem ? handleUpdate : handleCreate}>
                            {editingItem ? 'Save Changes' : 'Add FAQ'}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
};

export default FAQSection;
