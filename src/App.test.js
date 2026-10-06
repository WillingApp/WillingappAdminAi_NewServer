import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { AuthProvider } from './context/AuthContext';
import authService, { SESSION_KEY } from './services/authService';
import App from './App';

beforeEach(() => {
    authService.clearSession();
    window.history.replaceState({}, '', '/settings');
});

test('a direct dashboard URL requires administrator sign-in and rejects mock sessions', async () => {
    localStorage.setItem('willingapp_user', JSON.stringify({ name: 'Mock', token: 'mock' }));
    render(<MantineProvider><AuthProvider><App /></AuthProvider></MantineProvider>);
    expect(await screen.findByLabelText(/^Username/)).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
    expect(screen.queryByText('Admin Users')).not.toBeInTheDocument();
    expect(localStorage.getItem('willingapp_user')).toBeNull();
});

test('the login form displays a server rejection and stays unauthenticated', async () => {
    const login = jest.spyOn(authService, 'login').mockRejectedValue(new Error('Invalid credentials.'));
    render(<MantineProvider><AuthProvider><App /></AuthProvider></MantineProvider>);
    fireEvent.change(await screen.findByLabelText(/^Username/), { target: { value: 'test-admin' } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Invalid credentials.')).toBeInTheDocument();
    await waitFor(() => expect(login).toHaveBeenCalledWith('test-admin', 'test-password', false));
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    login.mockRestore();
});
