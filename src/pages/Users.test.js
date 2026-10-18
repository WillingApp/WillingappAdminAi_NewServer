import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import Users from './Users';
import userService from '../services/userService';
import generalService from '../services/generalService';
import { TableSearchProvider, useTableSearch } from '../context/TableSearchContext';

jest.mock('../services/userService', () => ({ __esModule: true, default: {
    getUsers: jest.fn(), isPhoneAvailable: jest.fn(), createUser: jest.fn(), setBlocked: jest.fn(),
} }));
jest.mock('../services/generalService', () => ({ __esModule: true, default: { getCountries: jest.fn() } }));
jest.mock('@mantine/notifications', () => ({ notifications: { show: jest.fn() } }));
jest.mock('../components/GenericTable', () => {
    const actual = jest.requireActual('../components/GenericTable');
    const React = require('react');
    return { ...actual, useTablePagination: () => {
        const [page, setPage] = React.useState(1);
        return { page, setPage, take: 10, skip: (page - 1) * 10, containerRef: () => {}, ready: true };
    } };
});

const active = { id: 19, name: 'דנה', phone: '0501234567', countryId: 91, languageId: 1, statusId: 1,
    imageUrl: null, creationTime: '2026-10-01T00:00:00Z', updateTime: '2026-10-01T00:00:00Z' };
const blocked = { ...active, statusId: 2 };
const list = (items = [active], total = items.length) => ({ isSuccessful: true, data: { items, total } });
const countries = [
    { id: 91, iso2: 'IL', phoneCode: '+972', isActive: true, names: [{ languageId: 1, name: 'ישראל' }] },
    { id: 1, iso2: 'AF', phoneCode: '+93', isActive: false, names: [{ languageId: 1, name: 'אפגניסטן' }] },
];

beforeAll(() => { Element.prototype.scrollIntoView = jest.fn(); });

function SearchControl() {
    const search = useTableSearch();
    return <input aria-label="חיפוש" value={search.searchTerm} onChange={event => search.setSearchTerm(event.target.value)} />;
}
function renderUsers() {
    return render(<MantineProvider><TableSearchProvider><SearchControl /><Users /></TableSearchProvider></MantineProvider>);
}

beforeEach(() => {
    jest.clearAllMocks();
    userService.getUsers.mockResolvedValue(list());
    userService.isPhoneAvailable.mockResolvedValue(true);
    userService.createUser.mockResolvedValue(undefined);
    userService.setBlocked.mockResolvedValue(blocked);
    generalService.getCountries.mockResolvedValue(countries);
});

test('loads users, searches, filters by status and hides mock notification actions', async () => {
    renderUsers();
    expect(await screen.findByText('דנה')).toBeInTheDocument();
    expect(userService.getUsers).toHaveBeenCalledWith(expect.objectContaining({ take: 10, skip: 0, statusId: undefined }));
    expect(screen.queryByText('Send to All')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('חיפוש'), { target: { value: '050' } });
    await waitFor(() => expect(userService.getUsers).toHaveBeenCalledWith(expect.objectContaining({
        Filter: { Search: { SearchTerm: '050' } }, skip: 0,
    })), { timeout: 2000 });
    fireEvent.click(screen.getByRole('textbox', { name: 'סינון לפי סטטוס' }));
    fireEvent.click(screen.getByRole('option', { name: 'חסום', hidden: true }));
    await waitFor(() => expect(userService.getUsers).toHaveBeenCalledWith(expect.objectContaining({ statusId: 2, skip: 0 })));
});

test('changing status resets pagination to the first server page', async () => {
    userService.getUsers.mockResolvedValue(list([active], 25));
    renderUsers();
    await screen.findByText('דנה');
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    await waitFor(() => expect(userService.getUsers).toHaveBeenCalledWith(expect.objectContaining({ skip: 10 })));
    fireEvent.click(screen.getByRole('textbox', { name: 'סינון לפי סטטוס' }));
    fireEvent.click(screen.getByRole('option', { name: 'חסום', hidden: true }));
    await waitFor(() => expect(userService.getUsers).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, statusId: 2 })));
    expect(screen.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page');
});

test('checks phone before creation, loads only active Hebrew countries and reloads users', async () => {
    renderUsers();
    await screen.findByText('דנה');
    fireEvent.click(screen.getByRole('button', { name: 'יצירת משתמש' }));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(generalService.getCountries).toHaveBeenCalledTimes(1));
    fireEvent.click(within(dialog).getByRole('textbox', { name: 'מדינה' }));
    expect(screen.queryByRole('option', { name: /אפגניסטן/, hidden: true })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: /ישראל/, hidden: true }));
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'טלפון' }), { target: { value: '0509998888' } });
    expect(within(dialog).getByRole('button', { name: 'יצירת משתמש' })).toBeDisabled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'בדיקת זמינות' }));
    expect(await within(dialog).findByRole('status')).toHaveTextContent('מספר הטלפון פנוי');
    fireEvent.click(within(dialog).getByRole('button', { name: 'יצירת משתמש' }));
    await waitFor(() => expect(userService.createUser).toHaveBeenCalledWith({ countryId: 91, phone: '0509998888' }));
    await waitFor(() => expect(userService.getUsers).toHaveBeenCalledTimes(2));
    expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({ title: 'המשתמש נוצר' }));
});

test('unavailable phone and backend failures never allow false creation success', async () => {
    userService.isPhoneAvailable.mockResolvedValueOnce(false).mockRejectedValueOnce(new Error('Network unavailable'));
    renderUsers();
    await screen.findByText('דנה');
    fireEvent.click(screen.getByRole('button', { name: 'יצירת משתמש' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'טלפון' }), { target: { value: '0501234567' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'בדיקת זמינות' }));
    expect(await within(dialog).findByText('מספר הטלפון כבר קיים במערכת.')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'יצירת משתמש' })).toBeDisabled();
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'טלפון' }), { target: { value: '0500000000' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'בדיקת זמינות' }));
    expect(await within(dialog).findByText(/Network unavailable/)).toBeInTheDocument();
    expect(userService.createUser).not.toHaveBeenCalled();
    expect(notifications.show).not.toHaveBeenCalled();
});

test('block and unblock require confirmation and refresh server status', async () => {
    userService.getUsers.mockReset().mockResolvedValueOnce(list([active])).mockResolvedValueOnce(list([blocked])).mockResolvedValueOnce(list([active]));
    userService.setBlocked.mockResolvedValueOnce(blocked).mockResolvedValueOnce(active);
    renderUsers();
    await screen.findByText('דנה');
    fireEvent.click(screen.getByRole('button', { name: 'חסימה של דנה' }));
    let dialog = await screen.findByRole('dialog');
    expect(userService.setBlocked).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'חסימה' }));
    await waitFor(() => expect(userService.setBlocked).toHaveBeenCalledWith(19, true));
    expect(await screen.findByRole('button', { name: 'ביטול חסימה של דנה' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'ביטול חסימה של דנה' }));
    dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'ביטול חסימה' }));
    await waitFor(() => expect(userService.setBlocked).toHaveBeenCalledWith(19, false));
    expect(await screen.findByRole('button', { name: 'חסימה של דנה' })).toBeInTheDocument();
    expect(userService.getUsers).toHaveBeenCalledTimes(3);
});

test('pending users cannot be blocked because the backend only accepts active users', async () => {
    userService.getUsers.mockResolvedValue(list([{ ...active, statusId: 3 }]));
    renderUsers();
    expect(await screen.findByText('ממתין להפעלה')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'חסימה של דנה' })).not.toBeInTheDocument();
    expect(userService.setBlocked).not.toHaveBeenCalled();
});

test('list and block failures are visible and never report success', async () => {
    userService.getUsers.mockRejectedValueOnce(new Error('List unavailable')).mockResolvedValueOnce(list());
    renderUsers();
    expect(await screen.findByText('List unavailable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'ניסיון חוזר' }));
    await screen.findByText('דנה');
    userService.setBlocked.mockRejectedValueOnce(new Error('Permission denied'));
    fireEvent.click(screen.getByRole('button', { name: 'חסימה של דנה' }));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'חסימה' }));
    await waitFor(() => expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'עדכון המשתמש נכשל', message: 'Permission denied', color: 'red',
    })));
    expect(screen.getByRole('button', { name: 'חסימה של דנה' })).toBeInTheDocument();
    expect(userService.getUsers).toHaveBeenCalledTimes(2);
});
