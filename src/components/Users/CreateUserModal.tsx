import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Group, Modal, Select, Stack, TextInput } from '@mantine/core';
import generalService, { Country } from '../../services/generalService';
import userService from '../../services/userService';

interface CreateUserModalProps {
    opened: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const errorText = (error: unknown) => error instanceof Error ? error.message : 'הבקשה נכשלה.';

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ opened, onClose, onSuccess }) => {
    const [countries, setCountries] = useState<Country[]>([]);
    const [countryId, setCountryId] = useState<string | null>(null);
    const [phone, setPhone] = useState('');
    const [checkedPhone, setCheckedPhone] = useState<string | null>(null);
    const [available, setAvailable] = useState(false);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [checking, setChecking] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const checkId = useRef(0);

    useEffect(() => {
        if (!opened) return;
        let disposed = false;
        setLoadingCountries(true);
        setError(null);
        void generalService.getCountries().then(result => {
            if (disposed) return;
            const active = result.filter(country => country.isActive);
            setCountries(active);
            if (active.length === 0) setError('אין מדינות פעילות ליצירת משתמש.');
        }).catch(err => {
            if (!disposed) setError(`טעינת המדינות נכשלה: ${errorText(err)}`);
        }).finally(() => {
            if (!disposed) setLoadingCountries(false);
        });
        return () => { disposed = true; checkId.current += 1; };
    }, [opened]);

    const closeModal = () => {
        if (creating) return;
        checkId.current += 1;
        setPhone('');
        setCountryId(null);
        setCheckedPhone(null);
        setAvailable(false);
        setChecking(false);
        setError(null);
        onClose();
    };

    const changePhone = (value: string) => {
        checkId.current += 1;
        setPhone(value);
        setCheckedPhone(null);
        setAvailable(false);
        setChecking(false);
        setError(null);
    };

    const checkPhone = async () => {
        const value = phone.trim();
        if (!value || checking || creating) return;
        const currentCheck = ++checkId.current;
        setChecking(true);
        setCheckedPhone(null);
        setAvailable(false);
        setError(null);
        try {
            const result = await userService.isPhoneAvailable(value);
            if (currentCheck !== checkId.current) return;
            setCheckedPhone(value);
            setAvailable(result);
            if (!result) setError('מספר הטלפון כבר קיים במערכת.');
        } catch (err) {
            if (currentCheck === checkId.current) setError(`בדיקת מספר הטלפון נכשלה: ${errorText(err)}`);
        } finally {
            if (currentCheck === checkId.current) setChecking(false);
        }
    };

    const createUser = async (event: React.FormEvent) => {
        event.preventDefault();
        const value = phone.trim();
        if (creating || !countryId || !available || checkedPhone !== value) return;
        setCreating(true);
        setError(null);
        try {
            await userService.createUser({ countryId: Number(countryId), phone: value });
            checkId.current += 1;
            setPhone('');
            setCountryId(null);
            setCheckedPhone(null);
            setAvailable(false);
            onSuccess();
            onClose();
        } catch (err) {
            setError(`יצירת המשתמש נכשלה: ${errorText(err)}`);
        } finally {
            setCreating(false);
        }
    };

    const countryOptions = countries.map(country => ({
        value: String(country.id),
        label: `${country.names.find(name => name.languageId === 1)?.name || country.iso2} (${country.phoneCode})`,
    })).sort((a, b) => a.label.localeCompare(b.label, 'he'));

    return (
        <Modal opened={opened} onClose={closeModal} title="יצירת משתמש" centered
            closeOnClickOutside={!creating} closeOnEscape={!creating} withCloseButton={!creating}>
            <form onSubmit={createUser} dir="rtl">
                <Stack>
                    {error && <Alert color="red" title="לא ניתן להשלים את הפעולה">{error}</Alert>}
                    <Select label="מדינה" placeholder="בחרו מדינה" data={countryOptions} value={countryId}
                        onChange={setCountryId} searchable required disabled={loadingCountries || creating || countries.length === 0}
                        nothingFoundMessage="לא נמצאו מדינות" />
                    <TextInput label="טלפון" type="tel" required value={phone} disabled={creating}
                        onChange={event => changePhone(event.currentTarget.value)} />
                    <Group justify="space-between">
                        <Button type="button" variant="light" onClick={checkPhone} loading={checking}
                            disabled={!phone.trim() || creating}>בדיקת זמינות</Button>
                        {available && checkedPhone === phone.trim() && <span role="status">מספר הטלפון פנוי</span>}
                    </Group>
                    <Group justify="flex-end">
                        <Button type="button" variant="default" disabled={creating} onClick={closeModal}>ביטול</Button>
                        <Button type="submit" loading={creating}
                            disabled={!countryId || !available || checkedPhone !== phone.trim()}>יצירת משתמש</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};
