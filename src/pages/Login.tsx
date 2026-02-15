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
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic Validation
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const success = await login(email, password, remember);
            if (!success) {
                setError('Invalid email or password');
            }
            // Success will automatically update AuthContext and trigger re-render in App.tsx
        } catch (err) {
            setError('An error occurred during login');
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
                        label="Email"
                        placeholder="example@gmail.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.currentTarget.value)}
                    />
                    <PasswordInput
                        label="Password"
                        placeholder="Your password"
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
