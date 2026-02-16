import React, { useEffect, useMemo } from 'react';
import {
    Title, Card, Badge, Group, Text, ActionIcon, Tooltip,
    Stack, Button
} from '@mantine/core';
import {
    IconCheck, IconHelp, IconRefresh, IconAlertCircle
} from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

import feedbackService from '../services/feedbackService';
import { Feedback } from '../services/apiTypes';
import { useApi } from '../hooks/useApi';
import { GenericTable, ColumnDef, useTablePagination } from '../components/GenericTable';
import { FeedbackDetailExpansion } from '../components/Feedbacks/FeedbackDetailExpansion';
import { useTableSearch } from '../context/TableSearchContext';
import './css/Freedbacks.css';

const ROW_HEIGHT = 50;
const INTERNAL_OFFSET = 120;

const Feedbacks: React.FC = () => {
    const { page, setPage, take, skip, containerRef, ready } = useTablePagination(ROW_HEIGHT, INTERNAL_OFFSET);
    const searchContext = useTableSearch();

    const searchTerm = searchContext?.searchTerm || '';
    const [debouncedSearch] = useDebouncedValue(searchTerm, 500);

    const { data: feedbackData, loading, error, execute } = useApi(feedbackService.getFeedbacks);

    useEffect(() => {
        if (searchContext) {
            searchContext.setIsVisible(true);
            searchContext.setPlaceholder('Search support messages...');
            return () => {
                searchContext.setIsVisible(false);
                searchContext.clearSearch();
            };
        }
    }, [searchContext]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, setPage]);

    useEffect(() => {
        if (!ready) return;
        execute({
            take,
            skip,
            Filter: debouncedSearch ? { Search: { SearchTerm: debouncedSearch } } : undefined
        });
    }, [execute, take, skip, debouncedSearch, ready]);

    const handleReset = () => {
        feedbackService.resetData();
        execute({ take, skip, Filter: debouncedSearch ? { Search: { SearchTerm: debouncedSearch } } : undefined });
        notifications.show({
            title: 'Data Reset',
            message: 'Feedback data has been reloaded from the mock file.',
            color: 'blue'
        });
    };

    const columns = useMemo<ColumnDef<Feedback>[]>(() => [
        {
            header: 'ID',
            key: 'feedback.id',
            render: (item) => <Text size="sm" fw={500}>#{item.feedback?.id || 'N/A'}</Text>
        },
        {
            header: 'Subject',
            key: 'feedback.message',
            render: (item) => (
                <Text size="sm" className="Freedbacks-subjectText" truncate="end" title={item.feedback?.message}>
                    {item.feedback?.message || '-'}
                </Text>
            )
        },
        {
            header: 'User',
            key: 'feedback.name',
            render: (item) => (
                <Stack gap={0}>
                    <Text size="sm" fw={500}>{item.feedback?.name || '-'}</Text>
                    <Text size="xs" c="dimmed">{item.feedback?.email || '-'}</Text>
                </Stack>
            )
        },
        {
            header: 'Status',
            key: 'feedback.status',
            render: (item) => {
                const status = item.feedback?.status;
                if (!status) return <Text size="sm" c="dimmed">---</Text>;
                const isOpen = status === 1;
                return (
                    <Badge
                        color={isOpen ? 'blue' : 'green'}
                        variant="light"
                        leftSection={isOpen ? <IconAlertCircle size={12} /> : <IconCheck size={12} />}
                    >
                        {isOpen ? 'Open' : 'Closed'}
                    </Badge>
                );
            }
        },
        {
            header: 'Created At',
            key: 'feedback.creationTime',
            render: (item) => <Text size="sm">{item.feedback?.creationTime ? new Date(item.feedback.creationTime).toLocaleString() : '-'}</Text>
        },
        {
            header: 'Handled By',
            key: 'admin',
            render: (item) => {
                const admin = item.admin;
                if (!admin || !admin.id) return <Text size="sm" c="dimmed">---</Text>;
                return (
                    <Text size="sm" c="blue" fw={500}>
                        {admin.firstName} {admin.lastName}
                    </Text>
                );
            }
        },
        {
            header: 'Actions',
            key: 'actions',
            render: (item) => {
                const isOpen = item.feedback?.status === 1;
                if (!isOpen || !item.feedback?.id) return null;

                const handleClose = async (e: React.MouseEvent) => {
                    e.stopPropagation();
                    try {
                        const success = await feedbackService.closeFeedback(item.feedback!.id, 1);
                        if (success) {
                            notifications.show({
                                title: 'Success',
                                message: 'Feedback closed.',
                                color: 'green',
                            });
                            execute({ take, skip, Filter: debouncedSearch ? { Search: { SearchTerm: debouncedSearch } } : undefined });
                        }
                    } catch (err) {
                        notifications.show({
                            title: 'Error',
                            message: 'Failed to close feedback.',
                            color: 'red',
                        });
                    }
                };

                return (
                    <Tooltip label="Close Request" withArrow>
                        <ActionIcon variant="light" color="red" size="md" onClick={handleClose}>
                            <IconCheck size={18} />
                        </ActionIcon>
                    </Tooltip>
                );
            }
        }
    ], [execute, take, skip, debouncedSearch]);

    const totalItems = feedbackData?.data?.total || 0;

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder flex={1} className="Freedbacks-card">
            <Group justify="space-between" mb="md">
                <Group gap="sm">
                    <IconHelp size={28} color="var(--mantine-color-blue-filled)" />
                    <Title order={2}>Support & Feedbacks</Title>
                </Group>
                <Group>
                    <Button
                        variant="subtle"
                        color="gray"
                        size="xs"
                        leftSection={<IconRefresh size={14} />}
                        onClick={handleReset}
                    >
                        Reset Mock Data
                    </Button>
                    <Badge size="lg" variant="filled">{totalItems} Total Requests</Badge>
                </Group>
            </Group>

            <div className="Freedbacks-tableContainer" ref={containerRef}>
                <GenericTable<Feedback>
                    data={feedbackData?.data?.items || []}
                    total={totalItems}
                    columns={columns}
                    loading={loading}
                    page={page}
                    pageSize={take}
                    onPageChange={setPage}
                    ExpansionComponent={({ data }) => (
                        <FeedbackDetailExpansion
                            data={data}
                            onStatusUpdate={() => execute({ take, skip, Filter: debouncedSearch ? { Search: { SearchTerm: debouncedSearch } } : undefined })}
                        />
                    )}
                    emptyMessage="No feedbacks found."
                />
            </div>
        </Card>
    );
};

export default Feedbacks;
