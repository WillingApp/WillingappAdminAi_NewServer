import React, { useState } from 'react';
import { Modal, TextInput, Textarea, Switch, Button, Stack, Group } from '@mantine/core';
import groupService from '../../services/groupService';
import { CreateGroupPayload } from '../../services/apiTypes';

interface CreateGroupModalProps {
    opened: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ opened, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [values, setValues] = useState<CreateGroupPayload>({
        name: '',
        description: '',
        imageFileKey: '',
        linkUrl: '',
        isOpenForAll: true,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (name: keyof CreateGroupPayload, value: any) => {
        setValues(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (values.name.length < 2) newErrors.name = 'Name must have at least 2 characters';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            await groupService.createGroup(values);
            setValues({
                name: '',
                description: '',
                imageFileKey: '',
                linkUrl: '',
                isOpenForAll: true,
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to create group:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Create New Group" centered size="md">
            <form onSubmit={handleSubmit}>
                <Stack>
                    <TextInput
                        label="Group Name"
                        placeholder="Enter group name"
                        required
                        value={values.name}
                        onChange={(e) => handleChange('name', e.currentTarget.value)}
                        error={errors.name}
                    />
                    <Textarea
                        label="Description"
                        placeholder="Enter group description"
                        value={values.description || ''}
                        onChange={(e) => handleChange('description', e.currentTarget.value)}
                    />
                    <TextInput
                        label="Image File Key"
                        placeholder="e.g. group-icon-123"
                        value={values.imageFileKey}
                        onChange={(e) => handleChange('imageFileKey', e.currentTarget.value)}
                    />
                    <TextInput
                        label="Link URL"
                        placeholder="https://example.com"
                        value={values.linkUrl || ''}
                        onChange={(e) => handleChange('linkUrl', e.currentTarget.value)}
                    />
                    <Switch
                        label="Open for All"
                        checked={values.isOpenForAll}
                        onChange={(e) => handleChange('isOpenForAll', e.currentTarget.checked)}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={loading}>
                            Create Group
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};
