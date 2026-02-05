import React, { createContext, useContext, useState, useCallback } from 'react';

interface TableSearchContextType {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    placeholder: string;
    setPlaceholder: (value: string) => void;
    isVisible: boolean;
    setIsVisible: (value: boolean) => void;
    clearSearch: () => void;
}

const TableSearchContext = createContext<TableSearchContextType | undefined>(undefined);

export const TableSearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [placeholder, setPlaceholder] = useState('Search...');
    const [isVisible, setIsVisible] = useState(false);

    const clearSearch = useCallback(() => {
        setSearchTerm('');
    }, []);

    const value = React.useMemo(() => ({
        searchTerm,
        setSearchTerm,
        placeholder,
        setPlaceholder,
        isVisible,
        setIsVisible,
        clearSearch,
    }), [searchTerm, placeholder, isVisible, clearSearch]);

    return (
        <TableSearchContext.Provider value={value}>
            {children}
        </TableSearchContext.Provider>
    );
};

export const useTableSearch = () => {
    const context = useContext(TableSearchContext);
    return context;
};
