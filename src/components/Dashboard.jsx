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

      // If current date is not in available dates, clear the selection
      if (!dates.includes(getCurrentDate())) {
        setSelectedDate('');
      }

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

  const renderChart = (sheetName) => {
    const sheetData = allData[sheetName] || [];
    const isLessThan3TripsChart = sheetName === 'lessThan3Trips';
    const currentTripCountFilter = isLessThan3TripsChart ? tripCountFilter : null;

    const filteredData = filterData(sheetData, selectedDate, selectedZone, currentTripCountFilter);
    const valueField = getValueField(sheetName);
    const chartData = processDataForChart(filteredData, valueField, 'Zone', sheetName, currentTripCountFilter);
    const chartOptions = getChartConfig(CHART_TITLES[sheetName], sheetName);

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
          availableDates={availableDates}
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
                <div>
                  {/* Trip Count Filter for lessThan3Trips chart */}
                  <div className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
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
                  {renderChart(sheetName)}
                </div>
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
