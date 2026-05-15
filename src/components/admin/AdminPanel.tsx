import React, { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Settings } from './Settings';

export const AdminPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
            {activeTab === 'settings' && <Settings />}
        </AdminLayout>
    );
};