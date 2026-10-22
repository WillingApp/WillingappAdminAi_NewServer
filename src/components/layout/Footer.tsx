import React from 'react';
import { Text, Center } from '@mantine/core';

const Footer: React.FC = () => {
    return (
        <Center h="100%">
            <Text size="sm" c="dimmed">
                © {new Date().getFullYear()} WillingApp Admin. All rights reserved.
            </Text>
        </Center>
    );
};

export default Footer;
