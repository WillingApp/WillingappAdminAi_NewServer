import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import generalService, { Metadata, MetadataItem } from '../services/generalService';
import { useAuth } from './AuthContext';

interface MetadataContextType {
    metadata: Metadata | null;
    loading: boolean;
    getTranslation: (type: keyof Metadata, id: number) => string;
}

const MetadataContext = createContext<MetadataContextType | undefined>(undefined);

export const MetadataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [metadata, setMetadata] = useState<Metadata | null>(null);
    const [loading, setLoading] = useState(false);
    const { isAuthenticated } = useAuth();

    const fetchMetadata = useCallback(async () => {
        setLoading(true);
        try {
            const response = await generalService.getMetadata();
            if (response.isSuccessful) {
                setMetadata(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch metadata:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchMetadata();
        }
    }, [isAuthenticated, fetchMetadata]);

    const getTranslation = useCallback((type: keyof Metadata, id: number): string => {
        if (!metadata) return `Unknown (${id})`;

        const list = metadata[type] as MetadataItem[];
        const item = list?.find(i => i.id === id);

        return item ? item.name : `Unknown (${id})`;
    }, [metadata]);

    return (
        <MetadataContext.Provider value={{ metadata, loading, getTranslation }}>
            {children}
        </MetadataContext.Provider>
    );
};

export const useMetadata = () => {
    const context = useContext(MetadataContext);
    if (!context) {
        throw new Error('useMetadata must be used within a MetadataProvider');
    }
    return context;
};
