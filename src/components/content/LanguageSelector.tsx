import React from 'react';
import { SegmentedControl, Stack, Text } from '@mantine/core';

interface LanguageSelectorProps {
    value: number;
    onChange: (value: number) => void;
}

const languages = [
    { label: 'Hebrew', value: '1' },
    { label: 'English', value: '2' },
    { label: 'Russian', value: '3' },
    { label: 'Arabic', value: '4' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange }) => {
    return (
        <SegmentedControl
            value={value.toString()}
            onChange={(val) => onChange(parseInt(val))}
            data={languages}
            color="blue"
            orientation="vertical"
            fullWidth
        />
    );
};

export default LanguageSelector;
