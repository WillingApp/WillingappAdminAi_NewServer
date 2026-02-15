import React, { useEffect, useMemo, useState } from 'react';
import {
    Title, Card, Badge, Group, Text, ActionIcon, Tooltip,
    Stack, Checkbox, Textarea, Button, Avatar
} from '@mantine/core';
import {
    IconCheck, IconX, IconMessage, IconMessage2,
    IconAlertCircle, IconPhoto, IconExternalLink, IconRefresh
} from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';

import reportService from '../services/reportService';
import adminService, { AdminUser } from '../services/adminService';
import { Report } from '../services/apiTypes';
import { useApi } from '../hooks/useApi';
import { GenericTable, ColumnDef, useTablePagination } from '../components/GenericTable';
import { ReportDetailExpansion } from '../components/Reports/ReportDetailExpansion';
import { useTableSearch } from '../context/TableSearchContext';
import { useMetadata } from '../context/MetadataContext';
import './css/Reports.css';

const ROW_HEIGHT = 50;
const INTERNAL_OFFSET = 120;

const Reports: React.FC = () => {
    const { page, setPage, take, skip, containerRef, ready } = useTablePagination(ROW_HEIGHT, INTERNAL_OFFSET);
    const searchContext = useTableSearch();
    const { getTranslation } = useMetadata();

    const searchTerm = searchContext?.searchTerm || '';
    const [debouncedSearch] = useDebouncedValue(searchTerm, 500);

    const { data: reportData, loading, error, execute } = useApi(reportService.getReports);
    const [admins, setAdmins] = useState<AdminUser[]>([]);

    useEffect(() => {
        adminService.getAdmins().then(setAdmins);
    }, []);

    useEffect(() => {
        if (searchContext) {
            searchContext.setIsVisible(true);
            searchContext.setPlaceholder('Search reports...');
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

    const handleResolve = (item: Report, resolution: 'APPROVED' | 'REJECTED') => {
        const report = item.report;
        const isApproved = resolution === 'APPROVED';
        const statusLabel = isApproved ? 'Approved' : 'Rejected';
        const statusCode = isApproved ? 3 : 2;

        modals.openConfirmModal({
            title: <Text fw={700}>{isApproved ? 'Confirm Valid Report' : 'Confirm Invalid Report'}</Text>,
            children: (
                <Stack gap="sm">
                    <Text size="sm">
                        Are you sure you want to mark this report as <b>{statusLabel}</b>?
                    </Text>
                </Stack>
            ),
            labels: { confirm: 'Confirm', cancel: 'Cancel' },
            confirmProps: { color: isApproved ? 'green' : 'red' },
            onConfirm: async () => {
                try {
                    // Pass admin ID 1 as hardcoded for now
                    const success = await reportService.resolveReport(report.id, statusCode, 1);
                    if (success) {
                        notifications.show({
                            title: 'Success',
                            message: `Report marked as ${resolution.toLowerCase()}.`,
                            color: 'green',
                        });
                        execute({ take, skip, Filter: debouncedSearch ? { Search: { SearchTerm: debouncedSearch } } : undefined });
                    }
                } catch (err) {
                    notifications.show({
                        title: 'Error',
                        message: 'Failed to update report.',
                        color: 'red',
                    });
                }
            },
        });
    };

    const handleSendMessage = (userId: number, userName: string) => {
        let message = '';
        modals.open({
            title: <Text fw={700}>Send Message to {userName}</Text>,
            children: (
                <Stack gap="md">
                    <Textarea
                        placeholder="Type your message here..."
                        label="Message content"
                        minRows={4}
                        onChange={(e) => message = e.currentTarget.value}
                    />
                    <Button
                        fullWidth
                        onClick={async () => {
                            if (!message.trim()) return;
                            try {
                                await reportService.sendMessage(userId, message);
                                notifications.show({
                                    title: 'Success',
                                    message: 'Message sent successfully.',
                                    color: 'green'
                                });
                                modals.closeAll();
                            } catch (err) {
                                notifications.show({
                                    title: 'Error',
                                    message: 'Failed to send message.',
                                    color: 'red'
                                });
                            }
                        }}
                    >
                        Send Message
                    </Button>
                </Stack>
            )
        });
    };

    const handleReset = () => {
        reportService.resetData();
        execute({ take, skip, Filter: debouncedSearch ? { Search: { SearchTerm: debouncedSearch } } : undefined });
        notifications.show({
            title: 'Data Reset',
            message: 'Reports data has been reloaded from the mock file.',
            color: 'blue'
        });
    };

    const columns = useMemo<ColumnDef<Report>[]>(() => [
        {
            header: 'ID',
            key: 'id',
            render: (item) => <Text size="sm">{item.id}</Text>
        },
        {
            header: 'Report Description',
            key: 'report.description',
            render: (item) => (
                <Text size="sm" className="Reports-contentCell" title={item.report.description}>
                    {item.report.description}
                </Text>
            )
        },
        {
            header: 'Reporter',
            key: 'reporter',
            render: (item) => (
                <Text size="sm">
                    ({item.reporter.id}) {item.reporter.name || 'Anonymous'}
                </Text>
            )
        },
        {
            header: 'Reported',
            key: 'reportedUser',
            render: (item) => (
                <Text size="sm">
                    ({item.reportedUser.id}) {item.reportedUser.name || 'Anonymous'}
                </Text>
            )
        },
        {
            header: 'Request ID',
            key: 'request.id',
            render: (item) => <Text size="sm">{item.request.id}</Text>
        },
        {
            header: 'Status',
            key: 'status',
            render: (item) => {
                const status = item.report.status;
                let label = 'Unknown';
                let color = 'gray';

                if (status === 1) {
                    label = 'Open';
                    color = 'blue';
                } else if (status === 2) {
                    label = 'Deleted';
                    color = 'gray';
                } else if (status === 3) {
                    label = 'Approved';
                    color = 'green';
                }

                return <Badge color={color} size="sm" variant="light">{label}</Badge>;
            }
        },
        {
            header: 'CreateTime',
            key: 'report.creationTime',
            render: (item) => new Date(item.report.creationTime).toLocaleString()
        },
        {
            header: 'UpdateTime',
            key: 'report.updateTime',
            render: (item) => new Date(item.report.updateTime).toLocaleString()
        },
        {
            header: 'Handled By',
            key: 'handledBy',
            render: (item) => {
                const adminId = item.report.handledByAdminId;
                const embeddedAdmin = item.admin;

                // Priority 1: Use embedded admin object if available and populated
                if (embeddedAdmin && embeddedAdmin.id && embeddedAdmin.firstName) {
                    return `(${embeddedAdmin.id}) ${embeddedAdmin.firstName} ${embeddedAdmin.lastName}`;
                }

                // Priority 2: Use handledByAdminId and lookup in admins list
                if (!adminId) return '-';
                const admin = admins.find(a => a.id === adminId.toString());
                const name = admin ? `${admin.firstName} ${admin.lastName}` : 'Unknown';
                return `(${adminId}) ${name}`;
            }
        },
        {
            header: 'Actions',
            key: 'actions',
            render: (item) => {
                const isOpen = item.report.status === 1;
                if (!isOpen) return null;

                return (
                    <Group gap={4}>
                        <Tooltip label="Mark as Valid" withArrow>
                            <ActionIcon variant="light" color="green" onClick={(e) => { e.stopPropagation(); handleResolve(item, 'APPROVED'); }}>
                                <IconCheck size={18} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Mark as Invalid" withArrow>
                            <ActionIcon variant="light" color="red" onClick={(e) => { e.stopPropagation(); handleResolve(item, 'REJECTED'); }}>
                                <IconX size={18} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Message Reporter" withArrow>
                            <ActionIcon variant="light" color="blue" onClick={(e) => { e.stopPropagation(); handleSendMessage(item.reporter.id, item.reporter.name || 'Reporter'); }}>
                                <IconMessage size={18} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Message Poster" withArrow>
                            <ActionIcon variant="light" color="cyan" onClick={(e) => { e.stopPropagation(); handleSendMessage(item.reportedUser.id, item.reportedUser.name || 'Poster'); }}>
                                <IconMessage2 size={18} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                );
            }
        }
    ], [execute, take, skip, debouncedSearch, admins]);

    const totalItems = reportData?.data?.total || 0;

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder flex={1} className="Reports-card">
            <Group justify="space-between" mb="md">
                <Title order={2}>Reports Management</Title>
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
                    <Badge size="lg" variant="filled">{totalItems} Total Reports</Badge>
                </Group>
            </Group>

            <div className="Reports-tableContainer" ref={containerRef}>
                <GenericTable<Report>
                    data={reportData?.data?.items || []}
                    total={totalItems}
                    columns={columns}
                    loading={loading}
                    page={page}
                    pageSize={take}
                    onPageChange={setPage}
                    ExpansionComponent={ReportDetailExpansion}
                    emptyMessage="No reports found."
                />
            </div>
        </Card>
    );
};

export default Reports;
