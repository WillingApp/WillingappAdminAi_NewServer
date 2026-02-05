import React from 'react';
import { AppShell } from '@mantine/core';
import Header from './Header';
import SideMenu from './SideMenu';
import Footer from './Footer';
import './AppLayout.css';

interface AppLayoutProps {
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 300,
                breakpoint: 'sm',
            }}
            footer={{ height: 40 }}
            padding="md"
        >
            <AppShell.Header>
                <Header />
            </AppShell.Header>

            <AppShell.Navbar>
                <SideMenu />
            </AppShell.Navbar>

            <AppShell.Main className="AppLayout-main">
                {children}
            </AppShell.Main>

            <AppShell.Footer>
                <Footer />
            </AppShell.Footer>
        </AppShell>
    );
};

export default AppLayout;
