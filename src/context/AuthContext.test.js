import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import authService, { SESSION_KEY } from '../services/authService';

jest.mock('@mantine/notifications', () => ({ notifications: { show: jest.fn() } }));

function Account() {
    const { user, isLoading } = useAuth();
    return <div>{isLoading ? 'Restoring session' : user ? `Signed in as ${user.username}` : 'Signed out'}</div>;
}
const savedSession = () => ({ userId: 7, username: 'remembered-admin', name: 'Remembered Admin', accessToken: 'old-access-token', refreshToken: 'refresh-token', accessTokenExpiration: new Date(Date.now() + 300000).toISOString() });
const reply = data => ({ ok: true, status: 200, json: async () => ({ isSuccessful: true, statusCode: 0, data }) });

beforeEach(() => {
    authService.clearSession();
    process.env.REACT_APP_API_BASE_URL = 'https://test-api.invalid';
    global.fetch = jest.fn();
});
afterEach(() => { authService.clearSession(); jest.useRealTimers(); });

test('an idle remembered session renews before five minutes instead of signing out', async () => {
    jest.useFakeTimers();
    localStorage.setItem(SESSION_KEY, JSON.stringify(savedSession()));
    render(<React.StrictMode><AuthProvider><Account /></AuthProvider></React.StrictMode>);
    expect(await screen.findByText('Signed in as remembered-admin')).toBeInTheDocument();
    fetch.mockImplementation(async () => reply({ ...savedSession(), accessToken: 'renewed-token', refreshToken: 'rotated-token' }));
    await act(async () => { jest.advanceTimersByTime(270000); });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toContain('/Identity/Login/Refresh');
    expect(screen.getByText('Signed in as remembered-admin')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(SESSION_KEY)).accessToken).toBe('renewed-token');
    await act(async () => { jest.advanceTimersByTime(30000); });
    expect(screen.getByText('Signed in as remembered-admin')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
});

test('expired Remember Me sessions renew while restoring after a reload', async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...savedSession(), accessTokenExpiration: new Date(Date.now() - 1000).toISOString() }));
    fetch.mockResolvedValue(reply({ ...savedSession(), accessToken: 'restored-token' }));
    render(<AuthProvider><Account /></AuthProvider>);
    expect(await screen.findByText('Signed in as remembered-admin')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(SESSION_KEY)).accessToken).toBe('restored-token');
    expect(fetch).toHaveBeenCalledTimes(1);
});

test('a sign-out in another tab updates the remembered session UI', async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(savedSession()));
    render(<AuthProvider><Account /></AuthProvider>);
    await screen.findByText('Signed in as remembered-admin');
    await act(async () => {
        localStorage.removeItem(SESSION_KEY);
        window.dispatchEvent(new StorageEvent('storage', { key: SESSION_KEY, storageArea: localStorage }));
    });
    await waitFor(() => expect(screen.getByText('Signed out')).toBeInTheDocument());
});
