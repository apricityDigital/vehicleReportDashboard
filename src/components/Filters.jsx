import React from 'react';

const Filters = ({
  selectedDate,
  setSelectedDate,
  selectedZone,
  setSelectedZone,
  availableZones,
  tripCountFilter,
  setTripCountFilter,
  showTripCountFilter = false,
  onRefresh,
  // New date range props
  dateRange,
  setDateRange,
  // Quick date filter props
  quickDate,
  setQuickDate
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8 backdrop-blur-sm bg-white/90">
      <div className="flex items-center mb-4">
        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mr-3">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800">Filters & Controls</h3>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-end justify-between">
        {/* Quick Date Filter - Top Right Corner */}
        <div className="lg:order-3 w-full lg:w-auto">
          <div className="flex justify-end">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-200 shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <label htmlFor="quick-date" className="text-sm font-semibold text-indigo-700 whitespace-nowrap">
                      Quick Date
                    </label>
                  </div>
                  <input
                    id="quick-date"
                    type="date"
                    value={quickDate || ''}
                    onChange={(e) => {
                      setQuickDate(e.target.value);
                      // Clear date range when quick date is selected
                      if (e.target.value) {
                        setDateRange({ from: '', to: '' });
                      }
                    }}
                    className="border-2 border-indigo-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm hover:shadow-md text-sm min-w-[140px]"
                  />
                  {quickDate && (
                    <button
                      onClick={() => setQuickDate('')}
                      className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-md transition-all duration-200"
                      title="Clear quick date"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Quick Date Presets */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setQuickDate(today);
                      setDateRange({ from: '', to: '' });
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-white border border-indigo-200 rounded-md hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 shadow-sm"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      const yesterdayStr = yesterday.toISOString().split('T')[0];
                      setQuickDate(yesterdayStr);
                      setDateRange({ from: '', to: '' });
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-white border border-indigo-200 rounded-md hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 shadow-sm"
                  >
                    Yesterday
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 flex-1 lg:order-1">
          {/* Date Range Filter */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Date Range
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-col">
                <label htmlFor="from-date" className="text-xs text-gray-600 mb-1">From</label>
                <input
                  id="from-date"
                  type="date"
                  value={dateRange?.from || ''}
                  onChange={(e) => {
                    setDateRange(prev => ({ ...prev, from: e.target.value }));
                    // Clear quick date when date range is selected
                    if (e.target.value) {
                      setQuickDate('');
                    }
                  }}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                  placeholder="Start date"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="to-date" className="text-xs text-gray-600 mb-1">To</label>
                <input
                  id="to-date"
                  type="date"
                  value={dateRange?.to || ''}
                  onChange={(e) => {
                    setDateRange(prev => ({ ...prev, to: e.target.value }));
                    // Clear quick date when date range is selected
                    if (e.target.value) {
                      setQuickDate('');
                    }
                  }}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                  placeholder="End date"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setDateRange({ from: '', to: '' })}
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-white border-2 border-gray-200 rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  title="Clear date range filter"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <label htmlFor="zone-select" className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Select Zone
            </label>
            <div className="relative">
              <select
                id="zone-select"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="border-2 border-gray-200 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md appearance-none cursor-pointer w-full"
              >
                <option value="">All Zones</option>
                {availableZones.map(zone => (
                  <option key={zone} value={zone}>
                    Zone {zone}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {showTripCountFilter && (
            <div className="flex flex-col">
              <label htmlFor="trip-count-select" className="text-sm font-medium text-gray-700 mb-1">
                Trip Count Filter
              </label>
              <select
                id="trip-count-select"
                value={tripCountFilter || 'all'}
                onChange={(e) => setTripCountFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All (&lt;3 trips)</option>
                <option value="0">0 Trips Only</option>
                <option value="1">1 Trip Only</option>
                <option value="2">2 Trips Only</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 lg:order-2">
          <button
            onClick={onRefresh}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>

          {((dateRange?.from || dateRange?.to) || quickDate || selectedZone || (showTripCountFilter && tripCountFilter && tripCountFilter !== 'all')) && (
            <button
              onClick={() => {
                setDateRange({ from: '', to: '' });
                setQuickDate('');
                setSelectedZone('');
                if (showTripCountFilter && setTripCountFilter) {
                  setTripCountFilter('all');
                }
              }}
              className="bg-white border-2 border-gray-300 hover:border-red-400 text-gray-700 hover:text-red-600 font-semibold py-3 px-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear All
            </button>
          )}
        </div>
      </div>

      {((dateRange?.from || dateRange?.to) || quickDate || selectedZone) && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex items-center mb-2">
            <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-blue-800">Active Filters</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(dateRange?.from || dateRange?.to) && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-blue-700 border border-blue-200 shadow-sm">
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Date Range: {dateRange?.from ? new Date(dateRange.from).toLocaleDateString() : 'Start'} - {dateRange?.to ? new Date(dateRange.to).toLocaleDateString() : 'End'}
              </span>
            )}
            {quickDate && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-indigo-700 border border-indigo-200 shadow-sm">
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Date: {new Date(quickDate).toLocaleDateString()}
              </span>
            )}
            {selectedZone && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-blue-700 border border-blue-200 shadow-sm">
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                Zone: {selectedZone}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters;
