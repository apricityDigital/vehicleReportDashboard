import React, { useState, useEffect } from 'react';
import BarChart from './BarChart';
import {
  filterData,
  processDataForChart,
  getChartConfig,
  CHART_TITLES,
  getValueField
} from '../utils/dataProcessor';

const VehicleTripsModal = ({
  isOpen,
  onClose,
  allData,
  dateRange,
  quickDate,
  selectedZone,
  loading,
  error
}) => {
  const [tripCountFilter, setTripCountFilter] = useState('all');
  const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'table'

  if (!isOpen) return null;

  const sheetName = 'lessThan3Trips';
  const sheetData = allData[sheetName] || [];
  const filteredData = filterData(sheetData, dateRange, selectedZone, tripCountFilter, sheetName, quickDate);
  const valueField = getValueField(sheetName);
  const chartData = processDataForChart(filteredData, valueField, 'Zone', sheetName, tripCountFilter);
  const chartOptions = getChartConfig(CHART_TITLES[sheetName], sheetName);

  // Calculate statistics
  const totalCount = chartData.datasets[0]?.data?.reduce((sum, value) => sum + value, 0) || 0;
  const maxValue = Math.max(...(chartData.datasets[0]?.data || [0]));
  const avgValue = totalCount > 0 ? (totalCount / chartData.labels.length).toFixed(1) : 0;

  // Fallback data for testing if no real data is available
  let displayChartData = chartData;
  if (chartData.labels.length === 0 && sheetData.length === 0) {
    displayChartData = {
      labels: ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'],
      datasets: [{
        label: 'Test Vehicles',
        data: [12, 8, 15, 6, 10],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        hoverBackgroundColor: 'rgba(239, 68, 68, 0.9)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false
      }]
    };
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-1 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-2xl w-full max-w-7xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center flex-1 min-w-0">
              <div className="bg-white bg-opacity-20 rounded-lg p-2 mr-3 flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{CHART_TITLES[sheetName]}</h2>
                <p className="text-red-100 mt-1 text-xs sm:text-sm lg:text-base">Detailed analysis and navigation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-2 transition-all duration-200 touch-manipulation mt-2 sm:mt-0 self-end sm:self-auto"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Mobile Responsive */}
        <div className="p-3 sm:p-4 lg:p-6 overflow-y-auto mobile-scroll max-h-[calc(98vh-120px)] sm:max-h-[calc(95vh-140px)]">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">Total Vehicles</p>
                  <p className="text-2xl font-bold text-red-700">{totalCount}</p>
                </div>
                <div className="bg-red-500 rounded-lg p-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Max per Zone</p>
                  <p className="text-2xl font-bold text-orange-700">{maxValue === -Infinity ? '0' : maxValue}</p>
                </div>
                <div className="bg-orange-500 rounded-lg p-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">Average</p>
                  <p className="text-2xl font-bold text-yellow-700">{avgValue}</p>
                </div>
                <div className="bg-yellow-500 rounded-lg p-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Active Zones</p>
                  <p className="text-2xl font-bold text-green-700">{chartData.labels.length}</p>
                </div>
                <div className="bg-green-500 rounded-lg p-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trip Count Filter:
                  </label>
                  <select
                    value={tripCountFilter}
                    onChange={(e) => setTripCountFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                  >
                    <option value="all">All Vehicles (&lt;3 trips)</option>
                    <option value="0">0 Trips Only</option>
                    <option value="1">1 Trip Only</option>
                    <option value="2">2 Trips Only</option>
                  </select>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setViewMode('chart')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewMode === 'chart'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Chart View
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewMode === 'table'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Table View
                </button>
              </div>
            </div>
          </div>

          {/* Chart or Table View */}
          {viewMode === 'chart' ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="h-96">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading chart data...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Error Loading Data</h3>
                      <p className="text-gray-500">{error}</p>
                    </div>
                  </div>
                ) : (
                  <BarChart
                    data={displayChartData}
                    options={chartOptions}
                    title={CHART_TITLES[sheetName]}
                    loading={loading}
                    error={error}
                    sheetName={sheetName}
                    rawData={filteredData}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayChartData.labels.map((label, index) => {
                      const value = displayChartData.datasets[0]?.data[index] || 0;
                      const percentage = totalCount > 0 ? ((value / totalCount) * 100).toFixed(1) : 0;
                      return (
                        <tr key={label} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{label}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{value}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{percentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleTripsModal;
