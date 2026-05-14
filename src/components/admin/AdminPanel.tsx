import React, { useState } from 'react';
import { RAGManager } from '../rag/RAGManager';
import { AdminLayout } from './AdminLayout';
import { Settings } from './Settings';

export const AdminPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
            {activeTab === 'rag' && <RAGManager />}
            {activeTab === 'settings' && <Settings />}
        </AdminLayout>
    );
};