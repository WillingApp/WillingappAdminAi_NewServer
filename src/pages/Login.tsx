import React, { useState } from 'react';
import {
    TextInput,
    PasswordInput,
    Checkbox,
    Button,
    Paper,
    Title,
    Text,
    Container,
    Group,
    Alert,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import './css/Login.css';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic Validation
        if (loading) return;
        if (!username.trim() || !password.trim()) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const success = await login(username, password, remember);
            if (!success) {
                setError('Invalid username or password');
            }
            // Success will automatically update AuthContext and trigger re-render in App.tsx
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size={420} className="Login-container">
            <Title className="Login-title">
                WillingApp Admin
            </Title>
            <Text c="dimmed" size="sm" className="Login-text">
                Please sign in to access your dashboard
            </Text>

            <Paper withBorder shadow="md" p={30} radius="md" className="Login-paper">
                {error && (
                    <Alert icon={<IconAlertCircle className="Login-alertIcon" />} title="Login Failed" color="red" mb="md">
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <TextInput
                        label="Username"
                        placeholder="Your administrator username"
                        autoComplete="username"
                        maxLength={50}
                        required
                        value={username}
                        onChange={(e) => setUsername(e.currentTarget.value)}
                    />
                    <PasswordInput
                        label="Password"
                        placeholder="Your password"
                        autoComplete="current-password"
                        maxLength={50}
                        required
                        mt="md"
                        value={password}
                        onChange={(e) => setPassword(e.currentTarget.value)}
                    />
                    <Group justify="space-between" mt="lg">
                        <Checkbox
                            label="Remember me"
                            checked={remember}
                            onChange={(event) => setRemember(event.currentTarget.checked)}
                        />
                    </Group>
                    <Button fullWidth mt="xl" type="submit" loading={loading}>
                        Sign in
                    </Button>
                </form>
            </Paper>
        </Container>
    );
};

export default LoginPage;
