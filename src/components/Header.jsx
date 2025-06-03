import React from 'react';
import apricityLogo from '../assets/apricity.png';
import imcLogo from '../assets/imc1.png';

const Header = ({ availableZones = [], user = null, onLogin, onLogout, onShowAdminPanel }) => {
  return (
    <header className="iccc-header shadow-2xl">
      {/* Main Header */}
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Logos and Branding */}
          <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
            {/* IMC Logo - Primary & Enhanced */}
            <div className="relative imc-logo-enhanced">
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl blur-sm opacity-30 animate-pulse"></div>
              <div className="relative logo-container w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-white to-blue-50 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg sm:shadow-xl p-2 sm:p-3 border border-blue-300 sm:border-2 hover:scale-105 transition-all duration-300">
                <img
                  src={imcLogo}
                  alt="IMC Logo - Primary Organization"
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
              {/* Premium badge */}
              <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
            </div>

            {/* IMC Text Branding */}
            <div className="text-white">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-0.5 sm:mb-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold imc-text-glow tracking-wide">
                  IMC
                </h1>
                <div className="imc-divider w-0.5 sm:w-1 h-4 sm:h-5 lg:h-6 bg-gradient-to-b from-blue-300 to-blue-500 rounded-full"></div>
                <h2 className="iccc-title text-base sm:text-lg lg:text-xl font-bold tracking-wide">ICCC</h2>
              </div>
              <p className="text-blue-200 text-xs sm:text-sm font-medium hidden sm:block">Indore Municipal Corporation</p>
              <p className="text-blue-300 text-xs hidden lg:block">Integrated Command and Control Center</p>
            </div>

            {/* Apricity Logo - Secondary */}
            <div className="logo-container w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white rounded-lg flex items-center justify-center shadow-md p-1 sm:p-1.5 opacity-75 hover:opacity-100 transition-opacity duration-300 hidden sm:flex">
              <img
                src={apricityLogo}
                alt="Apricity Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Center Section - Dashboard Title */}
          <div className="text-center text-white hidden md:block">
            <h2 className="iccc-title text-lg lg:text-xl font-bold">Daily Vehicle Report Dashboard</h2>
            <div className="flex items-center justify-center space-x-2 mt-1">
              <div className="status-indicator w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs text-green-300">Live System</span>
            </div>
          </div>

          {/* Right Section - User & Status */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            {/* System Status */}
            <div className="text-right text-white text-sm hidden sm:block">
              <div className="time-display text-blue-100 text-xs sm:text-sm">
                {new Date().toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div className="text-blue-300 text-xs hidden lg:block">
                {new Date().toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short'
                })}
              </div>
            </div>

            {/* User Authentication */}
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
              {user ? (
                <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
                  {/* Admin Dashboard Button (only for admins) */}
                  {user.role === 'admin' && onShowAdminPanel && (
                    <button
                      onClick={onShowAdminPanel}
                      className="px-2 sm:px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm rounded-lg transition-colors duration-200 flex items-center space-x-1 touch-manipulation min-h-[40px]"
                      title="Admin Dashboard"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="hidden sm:inline">Admin</span>
                      <span className="hidden lg:inline">Dashboard</span>
                    </button>
                  )}

                  {/* User Info */}
                  <div className="text-right text-white hidden md:block">
                    <div className="text-sm font-medium">{user.name || 'User'}</div>
                    <div className="text-xs text-blue-200 capitalize">{user.role || 'Operator'}</div>
                  </div>

                  {/* User Avatar */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-900" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={onLogout}
                    className="px-2 sm:px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm rounded-lg transition-colors duration-200 flex items-center space-x-1 touch-manipulation min-h-[40px]"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                /* Login Button */
                <button
                  onClick={onLogin}
                  className="px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm rounded-lg transition-colors duration-200 flex items-center space-x-1 sm:space-x-2 touch-manipulation min-h-[40px]"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-header with navigation and stats */}
      <div className="nav-breadcrumb border-t border-blue-700">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-2">
          <div className="flex items-center justify-between">
            {/* Navigation Breadcrumb */}
            <nav className="flex items-center space-x-1 sm:space-x-2 text-blue-200 text-xs sm:text-sm">
              <span className="hidden sm:inline">Dashboard</span>
              <svg className="w-3 h-3 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-white font-medium">Vehicle Reports</span>
              {/* Mobile Dashboard Title */}
              <div className="md:hidden ml-2 flex items-center space-x-1">
                <div className="status-indicator w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span className="text-green-300 text-xs">Live</span>
              </div>
            </nav>

            {/* Quick Stats */}
            <div className="flex items-center space-x-2 sm:space-x-4 text-blue-200 text-xs sm:text-sm">
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden sm:inline">Zones: </span>
                <span className="text-white font-semibold">{availableZones.length}</span>
              </div>

              <div className="flex items-center space-x-1 hidden sm:flex">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300">Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
