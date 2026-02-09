import { useState, useEffect, useCallback } from 'react';
import contentService, { FAQItem } from '../services/contentService';
import { notifications } from '@mantine/notifications';

export const useContent = (languageId: number) => {
    const [items, setItems] = useState<FAQItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchContent = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await contentService.getFAQContent(languageId);
            setItems(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch content');
            notifications.show({
                title: 'Error',
                message: 'Could not load FAQ content',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    }, [languageId]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const handleCreate = async (newItem: Omit<FAQItem, 'id'>) => {
        try {
            const created = await contentService.createFAQ(newItem);
            setItems((prev) => [...prev, created]);
            notifications.show({
                title: 'Success',
                message: 'New FAQ added (mock)',
                color: 'green',
            });
        } catch (err) {
            notifications.show({
                title: 'Error',
                message: 'Failed to create FAQ',
                color: 'red',
            });
        }
    };

    const handleUpdate = async (updatedItem: FAQItem) => {
        try {
            const updated = await contentService.updateFAQ(updatedItem);
            setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            notifications.show({
                title: 'Success',
                message: 'FAQ updated (mock)',
                color: 'green',
            });
        } catch (err) {
            notifications.show({
                title: 'Error',
                message: 'Failed to update FAQ',
                color: 'red',
            });
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await contentService.deleteFAQ(id);
            setItems((prev) => prev.filter((item) => item.id !== id));
            notifications.show({
                title: 'Success',
                message: 'FAQ deleted (mock)',
                color: 'green',
            });
        } catch (err) {
            notifications.show({
                title: 'Error',
                message: 'Failed to delete FAQ',
                color: 'red',
            });
        }
    };

    return {
        items,
        loading,
        error,
        refresh: fetchContent,
        create: handleCreate,
        update: handleUpdate,
        remove: handleDelete,
    };
};
