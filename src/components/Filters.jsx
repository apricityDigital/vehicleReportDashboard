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
    <div className="card mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex flex-col">
            <label htmlFor="date-picker" className="text-sm font-medium text-gray-700 mb-1">
              Select Date
            </label>
            <div className="flex gap-2">
              <input
                id="date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={() => setSelectedDate('')}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                title="Clear date filter"
              >
                All
              </button>
            </div>
          </div>

          <div className="flex flex-col">
            <label htmlFor="zone-select" className="text-sm font-medium text-gray-700 mb-1">
              Select Zone
            </label>
            <select
              id="zone-select"
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Zones</option>
              {availableZones.map(zone => (
                <option key={zone} value={zone}>
                  Zone {zone}
                </option>
              ))}
            </select>
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

        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
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
              className="btn-secondary"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {(selectedDate || selectedZone) && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Active Filters:</span>
            {selectedDate && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Date: {new Date(selectedDate).toLocaleDateString()}
              </span>
            )}
            {selectedZone && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Zone: {selectedZone}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default Filters;
