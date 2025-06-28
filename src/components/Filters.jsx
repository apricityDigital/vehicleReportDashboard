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
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 lg:mb-8 backdrop-blur-sm bg-white/90">
      <div className="flex items-center mb-3 sm:mb-4">
        <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mr-2 sm:mr-3">
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">Filters & Controls</h3>
      </div>

      {/* Mobile-First Responsive Filter Layout */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">

        {/* Date Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
          <label htmlFor="quick-date" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Date:
          </label>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <input
              id="quick-date"
              type="date"
              value={quickDate || ''}
              onChange={(e) => {
                setQuickDate(e.target.value);
                if (e.target.value) {
                  setDateRange({ from: '', to: '' });
                }
              }}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-40 min-h-[44px] touch-manipulation"
            />
            <div className="flex gap-1">
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setQuickDate(today);
                  setDateRange({ from: '', to: '' });
                }}
                className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors min-h-[44px] touch-manipulation flex-1 sm:flex-none"
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
                className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors min-h-[44px] touch-manipulation flex-1 sm:flex-none"
              >
                Yesterday
              </button>
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Range:</span>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <input
              id="from-date"
              type="date"
              value={dateRange?.from || ''}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, from: e.target.value }));
                if (e.target.value) {
                  setQuickDate('');
                }
              }}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-36 min-h-[44px] touch-manipulation"
              placeholder="From"
            />
            <span className="text-gray-500 text-center sm:text-left">to</span>
            <input
              id="to-date"
              type="date"
              value={dateRange?.to || ''}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, to: e.target.value }));
                if (e.target.value) {
                  setQuickDate('');
                }
              }}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-36 min-h-[44px] touch-manipulation"
              placeholder="To"
            />
          </div>
        </div>

        {/* Zone Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
          <label htmlFor="zone-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Zone:
          </label>
          <select
            id="zone-select"
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-32 min-h-[44px] touch-manipulation"
          >
            <option value="">All Zones</option>
            {availableZones.map(zone => (
              <option key={zone} value={zone}>
                Zone {zone}
              </option>
            ))}
          </select>
        </div>

        {/* Trip Count Filter (when shown) */}
        {showTripCountFilter && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
            <label htmlFor="trip-count-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Trips:
            </label>
            <select
              id="trip-count-select"
              value={tripCountFilter || 'all'}
              onChange={(e) => setTripCountFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-28 min-h-[44px] touch-manipulation"
            >
              <option value="all">All Trips</option>
              <option value="0">0 Trips</option>
              <option value="1">1 Trip</option>
              <option value="2">2 Trips</option>
            </select>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto lg:ml-auto">
          <button
            onClick={onRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
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
              className="bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-600 font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Active Filters Display - Mobile Responsive */}
      {((dateRange?.from || dateRange?.to) || quickDate || selectedZone || (showTripCountFilter && tripCountFilter && tripCountFilter !== 'all')) && (
        <div className="mt-3 sm:mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
            <span className="font-medium text-blue-800 whitespace-nowrap">Active Filters:</span>
            <div className="flex flex-wrap gap-2">
              {(dateRange?.from || dateRange?.to) && (
                <span className="px-2 py-1 bg-white text-blue-700 rounded text-xs border border-blue-200 break-all">
                  Range: {dateRange?.from ? new Date(dateRange.from).toLocaleDateString() : 'Start'} - {dateRange?.to ? new Date(dateRange.to).toLocaleDateString() : 'End'}
                </span>
              )}
              {quickDate && (
                <span className="px-2 py-1 bg-white text-blue-700 rounded text-xs border border-blue-200">
                  Date: {new Date(quickDate).toLocaleDateString()}
                </span>
              )}
              {selectedZone && (
                <span className="px-2 py-1 bg-white text-blue-700 rounded text-xs border border-blue-200">
                  Zone: {selectedZone}
                </span>
              )}
              {showTripCountFilter && tripCountFilter && tripCountFilter !== 'all' && (
                <span className="px-2 py-1 bg-white text-blue-700 rounded text-xs border border-blue-200">
                  Trips: {tripCountFilter}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters;
