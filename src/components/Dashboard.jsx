import React, { useState, useEffect } from 'react';
import BarChart from './BarChart';
import Filters from './Filters';
import { Bar } from 'react-chartjs-2';
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

        <div className="h-80">
          <Bar
            key={`${sheetName}-${selectedDate}-${selectedZone}-${tripCountFilter}`}
            data={chartData}
            options={chartOptions}
          />
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Daily Vehicle Report Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor vehicle performance across different zones and dates
          </p>
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

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.keys(CHART_TITLES).map(sheetName => (
            <div key={sheetName}>
              {sheetName === 'lessThan3Trips' ? (
                renderLessThan3TripsChart(sheetName)
              ) : (
                renderChart(sheetName)
              )}
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        {!loading && !error && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Zones</h3>
              <p className="text-3xl font-bold text-primary-600">{availableZones.length}</p>
            </div>
            <div className="card text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Date Range</h3>
              <p className="text-sm text-gray-600">
                {availableDates.length > 0 ? (
                  <>
                    {new Date(availableDates[0]).toLocaleDateString()} - {' '}
                    {new Date(availableDates[availableDates.length - 1]).toLocaleDateString()}
                  </>
                ) : 'No data'}
              </p>
            </div>
            <div className="card text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Last Updated</h3>
              <p className="text-sm text-gray-600">{new Date().toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
