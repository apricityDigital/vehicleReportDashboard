import React, { useState, useEffect } from 'react';
import BarChart from './BarChart';
import LineChart from './LineChart';
import Filters from './Filters';
import Header from './Header';
import AdminDashboard from './admin/AdminDashboard';
import VehicleTripsModal from './VehicleTripsModal';
import { useAuth } from '../contexts/AuthContext';
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
  const { user, logout } = useAuth();
  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [quickDate, setQuickDate] = useState(getCurrentDate()); // Set current date as default
  const [selectedZone, setSelectedZone] = useState('');
  const [tripCountFilter, setTripCountFilter] = useState('all');
  const [availableDates, setAvailableDates] = useState([]);
  const [availableZones, setAvailableZones] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showVehicleTripsModal, setShowVehicleTripsModal] = useState(false);

  // Authentication handlers
  const handleLogin = () => {
    // This will be handled by the AuthPage component
    console.log('Login should be handled by AuthPage');
  };

  const handleLogout = async () => {
    await logout();
  };

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

  const renderLessThan3TripsNavigationCard = (sheetName) => {
    const sheetData = allData[sheetName] || [];
    const filteredData = filterData(sheetData, dateRange, selectedZone, tripCountFilter, sheetName, quickDate);
    const valueField = getValueField(sheetName);
    const chartData = processDataForChart(filteredData, valueField, 'Zone', sheetName, tripCountFilter);

    // Calculate basic stats for preview
    const totalCount = chartData.datasets[0]?.data?.reduce((sum, value) => sum + value, 0) || 0;
    const maxValue = Math.max(...(chartData.datasets[0]?.data || [0]));
    const activeZones = chartData.labels.length;

    return (
      <div
        className="uniform-chart-card group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
        onClick={() => setShowVehicleTripsModal(true)}
      >
        {/* Enhanced Header */}
        <div className="card-header">
          <div className="flex items-center">
            <div className="card-icon bg-gradient-to-br from-red-500 to-orange-500">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="card-title">{CHART_TITLES[sheetName]}</h3>
              <div className="flex items-center mt-1">
                <div className="chart-status-indicator success"></div>
                <span className="text-xs text-gray-500 ml-2">
                  Click to open detailed view
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <svg className="w-6 h-6 text-gray-400 group-hover:text-red-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>

        {/* Preview Content */}
        <div className="chart-container">
          <div className="chart-area flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
            {/* Quick Stats Preview */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-md mb-6">
              <div className="text-center bg-white bg-opacity-70 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-2xl font-bold text-red-600">{totalCount}</div>
                <div className="text-xs text-gray-600">Total Vehicles</div>
              </div>
              <div className="text-center bg-white bg-opacity-70 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-2xl font-bold text-orange-600">{maxValue === -Infinity ? '0' : maxValue}</div>
                <div className="text-xs text-gray-600">Max per Zone</div>
              </div>
              <div className="text-center bg-white bg-opacity-70 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-2xl font-bold text-yellow-600">{activeZones}</div>
                <div className="text-xs text-gray-600">Active Zones</div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full px-6 py-3 font-semibold shadow-lg group-hover:shadow-xl transition-all duration-200 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Detailed Analysis
              </div>
            </div>

            {/* Feature Highlights */}
            {/* <div className="grid grid-cols-2 gap-3 mt-6 w-full max-w-md">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Advanced Filtering
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Chart & Table Views
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Interactive Data
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mobile Optimized
              </div>
            </div> */}
          </div>
        </div>
      </div>
    );
  };

  const renderChart = (sheetName) => {
    const sheetData = allData[sheetName] || [];
    const isLessThan3TripsChart = sheetName === 'lessThan3Trips';
    const currentTripCountFilter = isLessThan3TripsChart ? tripCountFilter : null;

    const filteredData = filterData(sheetData, dateRange, selectedZone, currentTripCountFilter, sheetName, quickDate);
    const valueField = getValueField(sheetName);
    const chartData = processDataForChart(filteredData, valueField, 'Zone', sheetName, currentTripCountFilter);
    const chartOptions = getChartConfig(CHART_TITLES[sheetName], sheetName);



    // Use LineChart for workshop chart, BarChart for others
    if (sheetName === 'sphereWorkshopExit') {
      return (
        <LineChart
          key={`${sheetName}-${dateRange?.from}-${dateRange?.to}-${quickDate}-${selectedZone}-${currentTripCountFilter}`}
          data={chartData}
          options={chartOptions}
          title={CHART_TITLES[sheetName]}
          loading={loading}
          error={error}
          sheetName={sheetName}
          rawData={filteredData}
        />
      );
    }

    return (
      <BarChart
        key={`${sheetName}-${dateRange?.from}-${dateRange?.to}-${quickDate}-${selectedZone}-${currentTripCountFilter}`}
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
    <div className="min-h-screen bg-gray-50">
      {/* ICCC Header */}
      <Header
        availableZones={availableZones}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onShowAdminPanel={() => setShowAdminPanel(true)}
      />

      {/* Admin Dashboard Modal */}
      {showAdminPanel && user?.role === 'admin' && (
        <AdminDashboard
          currentUser={user}
          onClose={() => setShowAdminPanel(false)}
        />
      )}

      {/* Vehicle Trips Modal */}
      <VehicleTripsModal
        isOpen={showVehicleTripsModal}
        onClose={() => setShowVehicleTripsModal(false)}
        allData={allData}
        dateRange={dateRange}
        quickDate={quickDate}
        selectedZone={selectedZone}
        loading={loading}
        error={error}
      />

      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Filters */}
        <Filters
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          dateRange={dateRange}
          setDateRange={setDateRange}
          quickDate={quickDate}
          setQuickDate={setQuickDate}
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

        {/* Enhanced Charts Grid - Mobile Responsive */}
        <div className="mobile-dashboard-grid md:grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 md:gap-6 lg:gap-8 auto-rows-fr">
          {Object.keys(CHART_TITLES).map(sheetName => (
            <div key={sheetName} className="flex">
              {sheetName === 'lessThan3Trips' ? (
                renderLessThan3TripsNavigationCard(sheetName)
              ) : (
                renderChart(sheetName)
              )}
            </div>
          ))}
        </div>

        {/* Enhanced Summary Stats - Mobile Responsive Typography */}
        {!loading && !error && (
          <div className="mt-8 md:mt-12">
          

          
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
