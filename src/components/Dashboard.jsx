import React, { useState, useEffect } from 'react';
import BarChart from './BarChart';
import Filters from './Filters';
import {
  fetchAllSheetsData,
  getUniqueZones,
  getUniqueDates
} from '../services/googleSheetsService';
import {
  getCurrentDate,
  filterData,
  processDataForChart,
  getChartConfig,
  CHART_TITLES,
  getValueField
} from '../utils/dataProcessor';

const Dashboard = () => {
  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [selectedZone, setSelectedZone] = useState('');
  const [tripCountFilter, setTripCountFilter] = useState('all');
  const [availableDates, setAvailableDates] = useState([]);
  const [availableZones, setAvailableZones] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchAllSheetsData();
      setAllData(data);

      // Extract unique dates and zones
      const dates = getUniqueDates(data);
      const zones = getUniqueZones(data);

      setAvailableDates(dates);
      setAvailableZones(zones);

      // Keep the current date selected by default, even if no data exists for it
      // This allows users to pick any date they want using the date picker

    } catch (err) {
      setError(err.message);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    loadData();
  };

  const renderLessThan3TripsChart = (sheetName) => {
    const sheetData = allData[sheetName] || [];
    const filteredData = filterData(sheetData, selectedDate, selectedZone, tripCountFilter);
    const valueField = getValueField(sheetName);
    const chartData = processDataForChart(filteredData, valueField, 'Zone', sheetName, tripCountFilter);
    const chartOptions = getChartConfig(CHART_TITLES[sheetName], sheetName);

    if (loading) {
      return (
        <div className="card">
          <div className="h-80 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-gray-600">Loading {CHART_TITLES[sheetName]}...</p>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="card">
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium">Error loading {CHART_TITLES[sheetName]}</p>
              <p className="text-gray-500 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      );
    }

    if (!chartData || !chartData.labels || chartData.labels.length === 0) {
      return (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{CHART_TITLES[sheetName]}</h3>

          {/* Trip Count Filter inside the card */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <label htmlFor={`trip-count-${sheetName}`} className="text-sm font-medium text-gray-700">
                Filter by Trip Count:
              </label>
              <select
                id={`trip-count-${sheetName}`}
                value={tripCountFilter}
                onChange={(e) => setTripCountFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="all">All Vehicles (&lt;3 trips)</option>
                <option value="0">0 Trips Only</option>
                <option value="1">1 Trip Only</option>
                <option value="2">2 Trips Only</option>
              </select>
            </div>
          </div>

          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">No data available</p>
              <p className="text-gray-500 text-sm mt-1">No data found for the selected filters</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="uniform-chart-card group">
        <div className="card-header">
          <div className="card-title">
            <div className="card-icon bg-gradient-to-r from-red-500 to-pink-500">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            {CHART_TITLES[sheetName]}
          </div>
          <div className="text-xs text-gray-500 bg-red-100 px-2 py-1 rounded-full">
            Underutilized
          </div>
        </div>

        {/* Compact Trip Count Filter */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 flex items-center">
              <svg className="w-4 h-4 text-red-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter:
            </span>
          </div>
          <select
            id={`trip-count-${sheetName}`}
            value={tripCountFilter}
            onChange={(e) => setTripCountFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-sm"
          >
            <option value="all">All Vehicles (&lt;3 trips)</option>
            <option value="0">0 Trips Only</option>
            <option value="1">1 Trip Only</option>
            <option value="2">2 Trips Only</option>
          </select>
        </div>

        {/* Chart Container */}
        <div className="chart-container">
          <div className="chart-area">
            <BarChart
              key={`${sheetName}-${selectedDate}-${selectedZone}-${tripCountFilter}`}
              data={chartData}
              options={chartOptions}
              title={CHART_TITLES[sheetName]}
              loading={false}
              error={null}
              sheetName={sheetName}
              rawData={filteredData}
            />
          </div>

          {/* Click instruction overlay */}
          <div className="click-instruction">
            <svg className="w-4 h-4 mr-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.121 2.122" />
            </svg>
            Click bars for details
          </div>
        </div>
      </div>
    );
  };

  const renderChart = (sheetName) => {
    const sheetData = allData[sheetName] || [];
    const isLessThan3TripsChart = sheetName === 'lessThan3Trips';
    const currentTripCountFilter = isLessThan3TripsChart ? tripCountFilter : null;

    const filteredData = filterData(sheetData, selectedDate, selectedZone, currentTripCountFilter);
    const valueField = getValueField(sheetName);
    const chartData = processDataForChart(filteredData, valueField, 'Zone', sheetName, currentTripCountFilter);
    const chartOptions = getChartConfig(CHART_TITLES[sheetName], sheetName);

    // Debug logging for chart data processing
    if (sheetName === 'onBoardAfter3PM') {
      console.log(`\n=== ${sheetName} CHART PROCESSING ===`);
      console.log('Raw sheet data:', sheetData);
      console.log('Selected date:', selectedDate);
      console.log('Selected zone:', selectedZone);
      console.log('Filtered data:', filteredData);
      console.log('Value field:', valueField);
      console.log('Final chart data:', chartData);
      console.log('Chart labels:', chartData.labels);
      console.log('Chart values:', chartData.datasets[0]?.data);
      console.log(`=== END ${sheetName} CHART PROCESSING ===\n`);
    }

    return (
      <BarChart
        key={`${sheetName}-${selectedDate}-${selectedZone}-${currentTripCountFilter}`}
        data={chartData}
        options={chartOptions}
        title={CHART_TITLES[sheetName]}
        loading={loading}
        error={error}
        sheetName={sheetName}
        rawData={filteredData}
      />
    );
  };

  if (loading && Object.keys(allData).length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Daily Vehicle Report Dashboard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Monitor vehicle performance across different zones and dates with real-time analytics
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Live Data
            </div>
            <span>•</span>
            <div>Last Updated: {new Date().toLocaleTimeString()}</div>
          </div>
        </div>

        {/* Filters */}
        <Filters
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
          availableZones={availableZones}
          onRefresh={handleRefresh}
        />

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading data
                </h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-8 auto-rows-fr">
          {Object.keys(CHART_TITLES).map(sheetName => (
            <div key={sheetName} className="flex">
              {sheetName === 'lessThan3Trips' ? (
                renderLessThan3TripsChart(sheetName)
              ) : (
                renderChart(sheetName)
              )}
            </div>
          ))}
        </div>

        {/* Enhanced Summary Stats */}
        {!loading && !error && (
          <div className="mt-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Overview</h2>
              <p className="text-gray-600">Key metrics and system information</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card text-center group hover:scale-105">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mx-auto mb-4 group-hover:shadow-lg transition-all duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Zones</h3>
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  {availableZones.length}
                </p>
                <p className="text-sm text-gray-500">Active monitoring zones</p>
              </div>

              <div className="card text-center group hover:scale-105">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mx-auto mb-4 group-hover:shadow-lg transition-all duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Date Range</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  {availableDates.length > 0 ? (
                    <>
                      <div className="font-medium text-green-600">
                        {new Date(availableDates[0]).toLocaleDateString()}
                      </div>
                      <div className="text-gray-400">to</div>
                      <div className="font-medium text-green-600">
                        {new Date(availableDates[availableDates.length - 1]).toLocaleDateString()}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400">No data available</div>
                  )}
                </div>
              </div>

              <div className="card text-center group hover:scale-105">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 group-hover:shadow-lg transition-all duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Last Updated</h3>
                <p className="text-sm font-medium text-purple-600 mb-1">
                  {new Date().toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date().toLocaleTimeString()}
                </p>
                <div className="mt-2 flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">Live</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
