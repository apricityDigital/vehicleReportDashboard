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
  onRefresh
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
        <div className="flex flex-col sm:flex-row gap-6 flex-1">
          <div className="flex flex-col">
            <label htmlFor="date-picker" className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Select Date
            </label>
            <div className="flex gap-3">
              <div className="relative">
                <input
                  id="date-picker"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border-2 border-gray-200 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                />
              </div>
              <button
                onClick={() => setSelectedDate('')}
                className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-white border-2 border-gray-200 rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                title="Clear date filter"
              >
                All Dates
              </button>
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

        <div className="flex gap-3">
          <button
            onClick={onRefresh}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>

          {(selectedDate || selectedZone || (showTripCountFilter && tripCountFilter && tripCountFilter !== 'all')) && (
            <button
              onClick={() => {
                setSelectedDate('');
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

      {(selectedDate || selectedZone) && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex items-center mb-2">
            <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-blue-800">Active Filters</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedDate && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-blue-700 border border-blue-200 shadow-sm">
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Date: {new Date(selectedDate).toLocaleDateString()}
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
