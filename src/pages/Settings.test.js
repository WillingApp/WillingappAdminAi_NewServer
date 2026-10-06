import React from 'react';
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import Settings from './Settings';
import authService, { SESSION_KEY } from '../services/authService';
import { notifications } from '@mantine/notifications';

jest.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { userId: 1, name: 'Current Admin', username: 'current' } }) }));
jest.mock('@mantine/notifications', () => ({ notifications: { show: jest.fn() } }));
const admins = [{ id: 1, name: 'Current Admin', username: 'current', isActive: true }, { id: 2, name: 'Other Admin', username: 'other', isActive: true }];
const envelope = data => ({ isSuccessful: true, statusCode: 0, data });
const response = body => ({ ok: true, status: 200, json: async () => body });

beforeEach(() => {
    authService.clearSession();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId: 1, username: 'current', name: 'Current Admin', accessToken: 'test-access-token', accessTokenExpiration: new Date(Date.now() + 60000).toISOString() }));
    process.env.REACT_APP_API_BASE_URL = 'https://test-api.invalid';
    global.fetch = jest.fn().mockResolvedValue(response(envelope({ items: admins, skip: 0, limit: 10, total: 2 })));
    notifications.show.mockClear();
});
afterEach(() => authService.clearSession());
function renderSettings() { return render(<MantineProvider><Settings /></MantineProvider>); }

test('loads real account fields and prevents self-deactivation', async () => {
    renderSettings();
    expect(await screen.findByText('Other Admin')).toBeInTheDocument();
    const ownRow = screen.getByText('Current Admin').closest('tr');
    expect(within(ownRow).getByRole('button', { name: 'Deactivate' })).toBeDisabled();
    expect(screen.queryByText('Email')).not.toBeInTheDocument();
});

test('opening Settings in StrictMode loads admins without aborting a discarded mount request', async () => {
    render(<React.StrictMode><MantineProvider><Settings /></MantineProvider></React.StrictMode>);
    expect(await screen.findByText('Other Admin')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1].signal).toBeUndefined();
});

test('an older list response cannot replace newer administrator search results', async () => {
    let resolveFirst;
    fetch.mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }));
    renderSettings();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const refreshedAdmin = { id: 3, name: 'Refreshed Admin', username: 'refreshed', isActive: true };
    fetch.mockResolvedValueOnce(response(envelope({ items: [refreshedAdmin], total: 1 })));
    fireEvent.change(screen.getByLabelText('Search administrators'), { target: { value: 'refreshed' } });
    expect(await screen.findByText('Refreshed Admin')).toBeInTheDocument();
    expect(new URL(fetch.mock.calls[1][0]).searchParams.get('Filter.Search.SearchTerm')).toBe('refreshed');
    await act(async () => {
        resolveFirst(response(envelope({ items: admins, total: 2 })));
    });
    expect(screen.getByText('Refreshed Admin')).toBeInTheDocument();
    expect(screen.queryByText('Other Admin')).not.toBeInTheDocument();
});

test('a request rejected after leaving Settings is handled without showing an error', async () => {
    let rejectRequest;
    fetch.mockImplementationOnce(() => new Promise((resolve, reject) => { rejectRequest = reject; }));
    const { unmount } = renderSettings();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    unmount();
    await act(async () => {
        rejectRequest(new Error('Network unavailable'));
    });
    expect(notifications.show).not.toHaveBeenCalled();
});

test('creation submits the API fields, clears password, and reloads the list', async () => {
    renderSettings();
    await screen.findByText('Other Admin');
    fireEvent.click(screen.getByRole('tab', { name: 'Create Admin' }));
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'New Admin' } });
    fireEvent.change(screen.getByLabelText(/^Username/), { target: { value: 'new-admin' } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'test-password' } });
    fetch.mockResolvedValueOnce(response(envelope({ id: 3, name: 'New Admin', username: 'new-admin', isActive: true })));
    fireEvent.click(screen.getByRole('button', { name: 'Create Admin' }));
    await waitFor(() => expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({ title: 'Administrator created' })));
    const mutation = fetch.mock.calls.find(([, options]) => options.method === 'POST');
    expect(mutation[0]).toBe('https://test-api.invalid/Admin/AdminUser');
    expect(JSON.parse(mutation[1].body)).toEqual({ name: 'New Admin', username: 'new-admin', password: 'test-password' });
    await screen.findByText('Other Admin');
    fireEvent.click(screen.getByRole('tab', { name: 'Create Admin' }));
    expect(screen.getByLabelText(/^Password/)).toHaveValue('');
});

test('duplicate creation displays a backend failure and never announces success', async () => {
    renderSettings();
    await screen.findByText('Other Admin');
    fireEvent.click(screen.getByRole('tab', { name: 'Create Admin' }));
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'New Admin' } });
    fireEvent.change(screen.getByLabelText(/^Username/), { target: { value: 'other' } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'test-password' } });
    fetch.mockResolvedValueOnce(response({ isSuccessful: false, statusCode: 1201, displayMessage: 'Username already exists.' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create Admin' }));
    expect(await screen.findByText('Username already exists.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/)).toHaveValue('');
    expect(notifications.show).not.toHaveBeenCalled();
});

test('owner/permission rejection leaves activation status unchanged and allows retry', async () => {
    renderSettings();
    await screen.findByText('Other Admin');
    fireEvent.click(within(screen.getByText('Other Admin').closest('tr')).getByRole('button', { name: 'Deactivate' }));
    const dialog = await screen.findByRole('dialog');
    fetch.mockResolvedValueOnce(response({ isSuccessful: false, statusCode: 1023, displayMessage: 'Owner cannot be edited.' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Deactivate' }));
    await waitFor(() => expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({ color: 'red', message: 'Owner cannot be edited.' })));
    expect(within(screen.getByText('Other Admin').closest('tr')).getByText('Active')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Deactivate' })).not.toBeDisabled();
});

test('a successful deactivation reloads server status', async () => {
    renderSettings();
    await screen.findByText('Other Admin');
    fireEvent.click(within(screen.getByText('Other Admin').closest('tr')).getByRole('button', { name: 'Deactivate' }));
    const dialog = await screen.findByRole('dialog');
    const updated = { ...admins[1], isActive: false };
    fetch.mockResolvedValueOnce(response(envelope(updated)));
    fetch.mockResolvedValueOnce(response(envelope({ items: [admins[0], updated], total: 2 })));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Deactivate' }));
    expect(await screen.findByRole('button', { name: 'Activate' })).toBeInTheDocument();
    const mutation = fetch.mock.calls.find(([, options]) => options.method === 'PUT');
    expect(JSON.parse(mutation[1].body)).toEqual({ value: false });
    expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({ color: 'green' }));
});

test('pagination requests the next server page', async () => {
    fetch.mockResolvedValue(response(envelope({ items: admins, total: 12 })));
    renderSettings();
    await screen.findByText('Other Admin');
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    await waitFor(() => expect(fetch.mock.calls.some(([url]) => new URL(url).searchParams.get('Skip') === '10')).toBe(true));
});
