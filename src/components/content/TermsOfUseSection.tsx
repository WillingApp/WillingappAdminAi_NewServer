import React, { useState } from 'react';
import { Paper, Title, TextInput, Button, Group, Stack, Anchor, Text, Divider } from '@mantine/core';
import { IconExternalLink, IconDeviceFloppy } from '@tabler/icons-react';
import contentService, { TermsLinks } from '../../services/contentService';
import { notifications } from '@mantine/notifications';

const TermsOfUseSection: React.FC = () => {
    const [links, setLinks] = useState<TermsLinks>({
        he: 'https://sites.google.com/view/willling-app-hebrew',
        en: 'https://sites.google.com/view/willing-app-english',
    });
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            await contentService.updateTermsLinks(links);
            notifications.show({
                title: 'Success',
                message: 'Terms of Use links updated successfully (mock)',
                color: 'green',
            });
            setIsEditing(false);
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to update links',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Stack gap="md">
            <Group justify="space-between" mb="md">
                <Title order={3}>External Terms of Use Links</Title>
                <Button
                    variant="light"
                    onClick={() => setIsEditing(!isEditing)}
                    color={isEditing ? 'gray' : 'blue'}
                >
                    {isEditing ? 'Cancel' : 'Edit Links'}
                </Button>
            </Group>

            <Stack gap="md">
                <Stack gap="xs">
                    <Text fw={500}>Terms of Use (Hebrew)</Text>
                    {isEditing ? (
                        <TextInput
                            placeholder="Enter Hebrew terms URL"
                            value={links.he}
                            onChange={(e) => setLinks({ ...links, he: e.currentTarget.value })}
                        />
                    ) : (
                        <Group gap="xs">
                            <Anchor href={links.he} target="_blank" rel="noopener noreferrer">
                                {links.he}
                            </Anchor>
                            <IconExternalLink size={14} />
                        </Group>
                    )}
                </Stack>

                <Divider />

                <Stack gap="xs">
                    <Text fw={500}>Terms of Use (English)</Text>
                    {isEditing ? (
                        <TextInput
                            placeholder="Enter English terms URL"
                            value={links.en}
                            onChange={(e) => setLinks({ ...links, en: e.currentTarget.value })}
                        />
                    ) : (
                        <Group gap="xs">
                            <Anchor href={links.en} target="_blank" rel="noopener noreferrer">
                                {links.en}
                            </Anchor>
                            <IconExternalLink size={14} />
                        </Group>
                    )}
                </Stack>

                {isEditing && (
                    <Group justify="flex-end" mt="md">
                        <Button
                            leftSection={<IconDeviceFloppy size={16} />}
                            onClick={handleSave}
                            loading={loading}
                        >
                            Save Links
                        </Button>
                    </Group>
                )}
            </Stack>
        </Stack>
    );
};

export default TermsOfUseSection;
