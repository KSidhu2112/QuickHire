import React from 'react';
import Sidebar from './Sidebar';
import { Outlet, Link } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = () => {
    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="admin-main">
                <header className="admin-top-bar">
                    <div className="admin-breadcrumb">
                        <Link to="/" className="breadcrumb-link">Admin Panel</Link> / <span className="active-view">{window.location.pathname.split('/').pop() || 'Dashboard'}</span>
                    </div>
                    <div className="admin-user-profile">
                        <span className="admin-badge">ADMIN</span>
                        <div className="admin-avatar">A</div>
                    </div>
                </header>
                <div className="admin-content-inner">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
