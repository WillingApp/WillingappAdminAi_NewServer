import React, { useState, useMemo } from 'react';
import { useViewportSize, useDebouncedValue } from '@mantine/hooks';
import {
    Table,
    Pagination,
    Group,
    Text,
    Stack,
    Loader,
    Center,
    ScrollArea,
} from '@mantine/core';
import './GenericTable.css';

export interface ColumnDef<T> {
    header: string;
    key: keyof T | string;
    render?: (item: T) => React.ReactNode;
}

interface GenericTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    total: number;
    loading: boolean;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    ExpansionComponent?: React.FC<{ data: T }>;
    emptyMessage?: string;
}

export function useTablePagination(rowHeight: number, uiOffset: number) {
    const { height } = useViewportSize();
    const [page, setPage] = useState(1);

    // Calculate how many rows can fit based on screen height
    const calculatedTake = useMemo(() => {
        const availableHeight = height - uiOffset;
        return Math.max(5, Math.floor(availableHeight / rowHeight));
    }, [height, uiOffset, rowHeight]);

    // Debounce the 'take' value to avoid excessive API calls during resize
    const [debouncedTake] = useDebouncedValue(calculatedTake, 300);

    return {
        page,
        setPage,
        take: debouncedTake,
        skip: (page - 1) * debouncedTake,
    };
}

export function GenericTable<T extends { id: string | number }>({
    data,
    columns,
    total,
    loading,
    page,
    pageSize,
    onPageChange,
    ExpansionComponent,
    emptyMessage = 'No data found',
}: GenericTableProps<T>) {
    const [expandedRow, setExpandedRow] = useState<string | number | null>(null);

    const toggleRow = (id: string | number) => {
        if (ExpansionComponent) {
            setExpandedRow(expandedRow === id ? null : id);
        }
    };

    const totalPages = Math.ceil(total / pageSize);

    if (loading && data.length === 0) {
        return (
            <Center py="xl">
                <Stack align="center" gap="xs">
                    <Loader size="md" />
                    <Text size="sm" c="dimmed">Loading data...</Text>
                </Stack>
            </Center>
        );
    }

    if (!loading && data.length === 0) {
        return (
            <Center py="xl">
                <Text c="dimmed">{emptyMessage}</Text>
            </Center>
        );
    }

    return (
        <Stack gap="md" className="GenericTable-container">
            <ScrollArea className="GenericTable-scrollArea" onScrollPositionChange={({ y }) => { }}>
                <Table verticalSpacing="sm" highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            {columns.map((col, index) => (
                                <Table.Th key={index}>{col.header}</Table.Th>
                            ))}
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {data.map((item) => (
                            <React.Fragment key={item.id}>
                                <Table.Tr
                                    onClick={() => toggleRow(item.id)}
                                    className={ExpansionComponent ? 'GenericTable-row-clickable' : 'GenericTable-row-default'}
                                >
                                    {columns.map((col, index) => (
                                        <Table.Td key={index}>
                                            {(() => {
                                                const content = col.render ? col.render(item) : (item[col.key as keyof T] as any);
                                                if (typeof content === 'object' && content !== null && !React.isValidElement(content)) {
                                                    // console.warn('Attempted to render object in GenericTable:', col.key, content);
                                                    return JSON.stringify(content);
                                                }
                                                return content;
                                            })()}
                                        </Table.Td>
                                    ))}
                                </Table.Tr>
                                {expandedRow === item.id && ExpansionComponent && (
                                    <Table.Tr>
                                        <Table.Td colSpan={columns.length}>
                                            <ExpansionComponent data={item} />
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </React.Fragment>
                        ))}
                    </Table.Tbody>
                </Table>
            </ScrollArea>

            {totalPages > 0 && (
                <Group justify="center" mt="md" py="xs">
                    <Pagination
                        total={totalPages}
                        value={page}
                        onChange={onPageChange}
                        size="sm"
                        radius="md"
                        withEdges
                    />
                </Group>
            )}
        </Stack>
    );
}
