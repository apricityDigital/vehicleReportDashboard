import React, { useState, useEffect } from 'react';
import UserManagement from './UserManagement';
import SystemSettings from './SystemSettings';
import Analytics from './Analytics';
import DataManagement from './DataManagement';

const AdminDashboard = ({ currentUser, onClose }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    approvedUsers: 0,
    suspendedUsers: 0
  });

  const tabs = [
    {
      id: 'users',
      name: 'User Management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      component: UserManagement
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      component: Analytics
    },
    {
      id: 'data',
      name: 'Data Management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      component: DataManagement
    },
    {
      id: 'settings',
      name: 'System Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      component: SystemSettings
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="fixed inset-0 admin-modal-backdrop flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Admin Dashboard</h2>
              <p className="text-blue-100 text-sm sm:text-base">Comprehensive system administration</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1 touch-manipulation"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
              <div className="text-lg sm:text-xl font-bold">{stats.totalUsers}</div>
              <div className="text-xs sm:text-sm text-blue-100">Total Users</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
              <div className="text-lg sm:text-xl font-bold text-yellow-300">{stats.pendingUsers}</div>
              <div className="text-xs sm:text-sm text-blue-100">Pending</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
              <div className="text-lg sm:text-xl font-bold text-green-300">{stats.approvedUsers}</div>
              <div className="text-xs sm:text-sm text-blue-100">Approved</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
              <div className="text-lg sm:text-xl font-bold text-red-300">{stats.suspendedUsers}</div>
              <div className="text-xs sm:text-sm text-blue-100">Suspended</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area - Fixed scrolling issue */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 admin-scrollbar">
          <div className="h-full">
            {ActiveComponent && (
              <ActiveComponent
                currentUser={currentUser}
                stats={stats}
                setStats={setStats}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
