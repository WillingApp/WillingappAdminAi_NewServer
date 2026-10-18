import React, { useEffect, useMemo, useState } from 'react';
import { ActionIcon, Alert, Badge, Button, Card, Group, Modal, Select, Stack, Text, Title, Tooltip } from '@mantine/core';
import { IconUserOff, IconUserPlus, IconUserCheck } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import userService, { User } from '../services/userService';
import { useApi } from '../hooks/useApi';
import { GenericTable, ColumnDef, useTablePagination } from '../components/GenericTable';
import { UserDetailExpansion } from '../components/Users/UserDetailExpansion';
import { CreateUserModal } from '../components/Users/CreateUserModal';
import { userStatusLabel } from '../components/Users/userPresentation';
import { useTableSearch } from '../context/TableSearchContext';
import './css/Users.css';

const ROW_HEIGHT = 52;
const INTERNAL_OFFSET = 120;
const ACTIVE_STATUS_ID = 1;
const BLOCKED_STATUS_ID = 2;
const messageOf = (error: unknown) => error instanceof Error ? error.message : 'הבקשה נכשלה.';

const Users: React.FC = () => {
    const { page, setPage, take, skip, containerRef, ready } = useTablePagination(ROW_HEIGHT, INTERNAL_OFFSET);
    const searchContext = useTableSearch();
    const searchTerm = searchContext?.searchTerm || '';
    const [debouncedSearch] = useDebouncedValue(searchTerm.trim(), 500);
    const [status, setStatus] = useState<string | null>('all');
    const [revision, setRevision] = useState(0);
    const [createOpened, setCreateOpened] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [updating, setUpdating] = useState(false);
    const { data, loading, error, execute } = useApi(userService.getUsers);

    useEffect(() => {
        if (!searchContext) return;
        searchContext.setIsVisible(true);
        searchContext.setPlaceholder('חיפוש משתמשים לפי שם או טלפון...');
        return () => {
            searchContext.setIsVisible(false);
            searchContext.clearSearch();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchContext?.setIsVisible, searchContext?.setPlaceholder, searchContext?.clearSearch]);

    useEffect(() => { setPage(1); }, [debouncedSearch, status, setPage]);

    useEffect(() => {
        if (!ready) return;
        void execute({
            take, skip,
            statusId: status === 'all' ? undefined : Number(status),
            Filter: debouncedSearch ? { Search: { SearchTerm: debouncedSearch } } : undefined,
        }).catch(() => {
            // useApi exposes the failure in the screen.
        });
    }, [execute, take, skip, debouncedSearch, status, ready, revision]);

    useEffect(() => {
        if (!data?.data) return;
        const lastPage = Math.max(1, Math.ceil(data.data.total / take));
        if (page > lastPage) setPage(lastPage);
    }, [data, page, setPage, take]);

    const handleCreateSuccess = () => {
        notifications.show({ title: 'המשתמש נוצר', message: 'המשתמש נוסף למערכת.', color: 'green' });
        searchContext?.clearSearch();
        setStatus('all');
        setPage(1);
        setRevision(value => value + 1);
    };

    const handleSetBlocked = async () => {
        if (!selectedUser || updating || ![ACTIVE_STATUS_ID, BLOCKED_STATUS_ID].includes(selectedUser.statusId)) return;
        const isBlocked = selectedUser.statusId !== BLOCKED_STATUS_ID;
        setUpdating(true);
        try {
            await userService.setBlocked(selectedUser.id, isBlocked);
            notifications.show({
                title: isBlocked ? 'המשתמש נחסם' : 'חסימת המשתמש בוטלה',
                message: isBlocked ? 'החסימה נשמרה במערכת.' : 'המשתמש יכול להתחבר שוב.',
                color: 'green',
            });
            setSelectedUser(null);
            setRevision(value => value + 1);
        } catch (err) {
            notifications.show({ title: 'עדכון המשתמש נכשל', message: messageOf(err), color: 'red' });
        } finally {
            setUpdating(false);
        }
    };

    const columns = useMemo<ColumnDef<User>[]>(() => [
        { header: 'מזהה', key: 'id' },
        { header: 'שם', key: 'name', render: user => user.name || '—' },
        { header: 'טלפון', key: 'phone', render: user => user.phone || '—' },
        { header: 'נוצר בתאריך', key: 'creationTime', render: user => new Date(user.creationTime).toLocaleDateString('he-IL') },
        { header: 'עודכן בתאריך', key: 'updateTime', render: user => new Date(user.updateTime).toLocaleDateString('he-IL') },
        { header: 'סטטוס', key: 'statusId', render: user => (
            <Badge color={user.statusId === 1 ? 'green' : user.statusId === BLOCKED_STATUS_ID ? 'red' : 'yellow'} variant="outline">
                {userStatusLabel(user.statusId)}
            </Badge>
        ) },
        { header: 'פעולות', key: 'actions', render: user => {
            if (user.statusId !== ACTIVE_STATUS_ID && user.statusId !== BLOCKED_STATUS_ID) {
                return <Text size="sm" c="dimmed">{user.statusId === 3 ? 'ממתין להפעלה' : 'פעולה לא זמינה'}</Text>;
            }
            const isBlocked = user.statusId === BLOCKED_STATUS_ID;
            const label = isBlocked ? 'ביטול חסימה' : 'חסימה';
            return (
                <Tooltip label={label}>
                    <ActionIcon aria-label={`${label} של ${user.name || user.phone || user.id}`}
                        color={isBlocked ? 'green' : 'red'} variant="light" disabled={updating}
                        onClick={event => { event.stopPropagation(); setSelectedUser(user); }}>
                        {isBlocked ? <IconUserCheck size={18} /> : <IconUserOff size={18} />}
                    </ActionIcon>
                </Tooltip>
            );
        } },
    ], [updating]);

    const totalItems = data?.data?.total ?? 0;
    const isBlocking = selectedUser?.statusId !== BLOCKED_STATUS_ID;

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder className="Users-card" flex={1} dir="rtl">
            <Group justify="space-between" mb="md">
                <Group>
                    <Title order={2}>ניהול משתמשים</Title>
                    <Badge size="lg" variant="filled">{totalItems} {totalItems === 1 ? 'משתמש' : 'משתמשים'}</Badge>
                </Group>
                <Group>
                    <Select label="סינון לפי סטטוס" value={status} onChange={setStatus} allowDeselect={false}
                        data={[{ value: 'all', label: 'הכול' }, { value: '1', label: 'פעיל' },
                            { value: '2', label: 'חסום' }, { value: '3', label: 'ממתין' }]} />
                    <Button leftSection={<IconUserPlus size={16} />} onClick={() => setCreateOpened(true)}>יצירת משתמש</Button>
                </Group>
            </Group>

            {error && <Alert color="red" title="טעינת המשתמשים נכשלה" mb="md">
                <Stack gap="xs" align="flex-start">
                    <Text>{error}</Text>
                    <Button size="xs" variant="light" onClick={() => setRevision(value => value + 1)}>ניסיון חוזר</Button>
                </Stack>
            </Alert>}
            <div className="Users-tableContainer" ref={containerRef}>
                {!error && <GenericTable<User> data={data?.data?.items || []} total={totalItems} columns={columns}
                    loading={loading} page={page} pageSize={take} onPageChange={setPage}
                    ExpansionComponent={UserDetailExpansion} emptyMessage="לא נמצאו משתמשים."
                    loadingMessage="טוען משתמשים..." />}
            </div>

            <CreateUserModal opened={createOpened} onClose={() => setCreateOpened(false)} onSuccess={handleCreateSuccess} />
            <Modal opened={selectedUser !== null} onClose={() => { if (!updating) setSelectedUser(null); }}
                closeOnClickOutside={!updating} closeOnEscape={!updating} withCloseButton={!updating}
                title={isBlocking ? 'חסימת משתמש' : 'ביטול חסימה'} centered>
                <Stack dir="rtl">
                    <Text>האם {isBlocking ? 'לחסום' : 'לבטל את החסימה של'} {selectedUser?.name || selectedUser?.phone || selectedUser?.id}?</Text>
                    <Group justify="flex-end">
                        <Button variant="default" disabled={updating} onClick={() => setSelectedUser(null)}>ביטול</Button>
                        <Button color={isBlocking ? 'red' : 'green'} loading={updating} onClick={handleSetBlocked}>
                            {isBlocking ? 'חסימה' : 'ביטול חסימה'}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Card>
    );
};

export default Users;
