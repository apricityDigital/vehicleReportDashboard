import React, { useState, useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { getCurrentTheme, getThemedChartColors } from '../utils/themeUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = ({ data, options, title, loading = false, error = null, sheetName = '', rawData = [] }) => {
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(loading);
  const [hoveredBar, setHoveredBar] = useState(null);
  const chartRef = useRef(null);
  const [themeColors, setThemeColors] = useState(getThemedChartColors());
  const isIssueChart = ['issuesPost0710', 'vehicleBreakdown', 'fuelStation', 'post06AMOpenIssues'].includes(sheetName); 
  useEffect(() => {
    // Update theme colors when theme changes
    const handleThemeChange = () => {
      setThemeColors(getThemedChartColors());
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);

  const handleChartClick = (event, elements) => {
    if (elements.length > 0) {
      const elementIndex = elements[0].index;
      const datasetIndex = elements[0].datasetIndex;
      const dataset = data.datasets[datasetIndex];
      const label = data.labels[elementIndex];
      const value = dataset.data[elementIndex];

      // For issue charts, use existing breakdown logic
      if (isIssueChart && dataset.issueBreakdowns && dataset.issueBreakdowns[label]) {
        setSelectedDetails({
          type: 'issue',
          zone: label,
          title: title,
          sheetName: sheetName,
          breakdown: dataset.issueBreakdowns[label],
          total: value,
          details: dataset.vehicleDetails ? dataset.vehicleDetails[label] : null
        });
      } else {
        // For all other charts, show detailed data from the raw sheet data
        const zoneData = rawData.filter(row => String(row.Zone) === String(label));

        // Special handling for route coverage percentage chart
        if (sheetName === 'glitchPercentage') {
          // Extract the actual percentage value from the data
          // For percentage charts, value might be an object {x, y, remarks} or a number
          let percentageValue = 0;

          if (typeof value === 'object' && value !== null && value.y !== undefined) {
            // Value is an object from chart data
            percentageValue = value.y;
          } else if (typeof value === 'number') {
            // Value is already a number
            percentageValue = value;
          } else if (zoneData.length > 0) {
            // Fallback to raw data
            percentageValue = zoneData[0].Percentage || zoneData[0].Count || 0;
          }

          setSelectedDetails({
            type: 'percentage',
            zone: label,
            title: title,
            sheetName: sheetName,
            total: typeof percentageValue === 'number' ? percentageValue : parseFloat(percentageValue) || 0,
            rawData: zoneData,
            details: null
          });
        } else if (sheetName === 'vehicleNumbers') {
          // Special handling for vehicle numbers chart
          setSelectedDetails({
            type: 'vehicleNumbers',
            zone: label,
            title: title,
            sheetName: sheetName,
            total: value,
            rawData: zoneData,
            details: null
          });
        } else if (sheetName === 'sphereWorkshopExit') {
          // Special handling for workshop exit chart - label is now workshop departure time
          const workshopTime = label;
          const zone = value;

          setSelectedDetails({
            type: 'workshop',
            zone: zone,
            workshopTime: workshopTime,
            title: title,
            sheetName: sheetName,
            total: value,
            rawData: rawData.filter(row => row['Workshop Departure Time'] === workshopTime),
            details: dataset.vehicleDetails ? dataset.vehicleDetails[label] : null
          });
        } else if (sheetName === 'vehicleBreakdown') {
          // Special handling for vehicle breakdown chart
          let breakdownDetails = null;

          // Look for Details array in the zone data from transformVehicleBreakdownData
          const zoneWithDetails = zoneData.find(row => row.Details && Array.isArray(row.Details) && row.Details.length > 0);
          if (zoneWithDetails) {
            breakdownDetails = zoneWithDetails.Details.map(detail => ({
              vehicleNo: detail.vehicleNo,
              breakdownTime: detail.breakdownTime,
              issue: detail.issue,
              spareStatus: detail.spareStatus,
              spareTime: detail.spareTime,
              ward: detail.ward,
              date: zoneWithDetails.Date
            }));
          } else {
            // Fallback: create breakdown details from individual rows if Details array not found
            breakdownDetails = zoneData.map(row => ({
              vehicleNo: row['Vehicle No.'] || `Vehicle ${Math.random().toString(36).substr(2, 5)}`,
              breakdownTime: row['Breakdown Time'] || 'Time not specified',
              issue: row.Issue || 'Unknown Issue',
              spareStatus: row['Spare/OK'] || 'Unknown',
              spareTime: row['Spare/OK Time'] || '',
              ward: row.Ward || '',
              date: row.Date || ''
            })).filter(detail => detail.vehicleNo);
          }

          setSelectedDetails({
            type: 'vehicleBreakdown',
            zone: label,
            title: title,
            sheetName: sheetName,
            total: value,
            rawData: zoneData,
            details: breakdownDetails && breakdownDetails.length > 0 ? breakdownDetails : null
          });
        } else if (sheetName === 'fuelStation' || sheetName === 'issuesPost0710' || sheetName === 'post06AMOpenIssues') {
          // Extract timing details from the zone data
          let timingDetails = null;

          // Look for Details array in the zone data (this should be available from the new transformFuelStationData function)
          const zoneWithDetails = zoneData.find(row => row.Details && Array.isArray(row.Details) && row.Details.length > 0);
          if (zoneWithDetails) {
            timingDetails = zoneWithDetails.Details;
          } else {
            // Fallback: create timing details from individual rows if Details array not found
            timingDetails = zoneData.map(row => ({
              vehicleNo: row['Vehicle No.'] || row['Vehicle Number'] || row['Vehicle'] || `Vehicle ${Math.random().toString(36).substr(2, 5)}`,
              time: row.Time || row['Late Time'] || row['Arrival Time'] || row['Departure Time'] || row['Fuel Station Time'] || 'Time not specified',
              issue: row.Issue || row.Reason || row.Type || (sheetName === 'fuelStation' ? 'Fuel Station Visit' : 'Late Vehicle'),
              status: row.Status || row['Spare/OK'] || 'Unknown',
              breakdownTime: row['Breakdown Time'] || '',
              spareTime: row['Spare/OK Time'] || row['Spare Time'] || '',
              spareStatus: row['Spare Status'] || '',
              remarks: row.Remarks || row.Notes || ''
            })).filter(detail => detail.vehicleNo && detail.time);
          }

          setSelectedDetails({
            type: 'timing',
            zone: label,
            title: title,
            sheetName: sheetName,
            total: value,
            rawData: zoneData,
            details: timingDetails && timingDetails.length > 0 ? timingDetails : null
          });
        } else {
          setSelectedDetails({
            type: 'general',
            zone: label,
            title: title,
            sheetName: sheetName,
            total: value,
            rawData: zoneData,
            details: null
          });
        }
      }
    }
  };

  // Enhanced chart options with theme support and better interactivity
  const enhancedOptions = {
    ...options,
    onClick: handleChartClick,
    onHover: (event, elements) => {
      setHoveredBar(elements.length > 0 ? elements[0].index : null);
    },
    plugins: {
      ...options?.plugins,
      legend: {
        ...options?.plugins?.legend,
        labels: {
          ...options?.plugins?.legend?.labels,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            weight: '500'
          },
          color: '#374151'
        }
      },
      tooltip: {
        ...options?.plugins?.tooltip,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: themeColors.primary,
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        usePointStyle: true,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          ...options?.plugins?.tooltip?.callbacks,
          title: (context) => {
            return `Zone ${context[0].label}`;
          },
          label: (context) => {
            const value = context.parsed.y;
            const percentage = sheetName === 'glitchPercentage' ? '%' : '';

            // Special tooltip for vehicle breakdown chart
            if (sheetName === 'vehicleBreakdown') {
              const vehicleText = value === 1 ? 'Vehicle' : 'Vehicles';
              return `${value} ${vehicleText} Breakdown`;
            }

            return `${context.dataset.label}: ${value}${percentage}`;
          }
        }
      }
    },
    scales: {
      ...options?.scales,
      x: {
        ...options?.scales?.x,
        grid: {
          ...options?.scales?.x?.grid,
          color: 'rgba(156, 163, 175, 0.2)',
          borderColor: 'rgba(156, 163, 175, 0.3)'
        },
        ticks: {
          ...options?.scales?.x?.ticks,
          color: '#6b7280',
          font: {
            size: 11,
            weight: '500'
          }
        }
      },
      y: {
        ...options?.scales?.y,
        grid: {
          ...options?.scales?.y?.grid,
          color: 'rgba(156, 163, 175, 0.2)',
          borderColor: 'rgba(156, 163, 175, 0.3)'
        },
        ticks: {
          ...options?.scales?.y?.ticks,
          color: '#6b7280',
          font: {
            size: 11,
            weight: '500'
          }
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  if (isLoading) {
    return (
      <div className="uniform-chart-card group">
        <div className="card-header">
          <div className="flex items-center">
            <div className="card-icon">
              <svg className="w-5 h-5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="card-title">{title}</h3>
              <div className="flex items-center mt-1">
                <div className="chart-status-indicator warning"></div>
                <span className="text-xs text-gray-500 ml-2">Loading chart data...</span>
              </div>
            </div>
          </div>
          <div className="chart-metric-badge">
            <svg className="w-3 h-3 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Loading...
          </div>
        </div>
        <div className="chart-container">
          <div className="chart-area chart-loading">
            <div className="text-center">
              <div className="chart-loading-spinner mb-4"></div>
              <p className="text-gray-600 font-medium">Loading Chart...</p>
              <p className="text-gray-400 text-sm mt-1">Preparing visualization</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="uniform-chart-card group">
        <div className="card-header">
          <div className="flex items-center">
            <div className="card-icon bg-gradient-to-br from-red-500 to-red-600">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="card-title">{title}</h3>
              <div className="flex items-center mt-1">
                <div className="chart-status-indicator error"></div>
                <span className="text-xs text-gray-500 ml-2">Error loading data</span>
              </div>
            </div>
          </div>
          <div className="chart-metric-badge bg-red-50 text-red-700 border-red-200">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Error
          </div>
        </div>
        <div className="chart-container">
          <div className="chart-area flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-600 font-semibold text-lg">Error Loading Chart</p>
              <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <div className="uniform-chart-card group">
        <div className="card-header">
          <div className="flex items-center">
            <div className="card-icon bg-gradient-to-br from-gray-400 to-gray-500">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="card-title mobile-title-truncate" title={title}>{title}</h3>
              <div className="flex items-center mt-1">
                <div className="chart-status-indicator error"></div>
                <span className="responsive-text-xs text-gray-500 ml-2">No data available</span>
              </div>
            </div>
          </div>
          <div className="chart-metric-badge bg-gray-50 text-gray-600 border-gray-200">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            Empty
          </div>
        </div>
        <div className="chart-container">
          <div className="chart-area flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-20 h-20 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-600 font-semibold text-lg">No Data Available</p>
              <p className="text-gray-400 text-sm mt-2">Chart will appear when data is loaded</p>
              <div className="mt-4">
                <span className="chart-metric-badge bg-gray-50 text-gray-600 border-gray-200">Waiting for data...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate chart metrics for display
  const totalDataPoints = data?.labels?.length || 0;
  const maxValue = data?.datasets?.[0]?.data ? Math.max(...data.datasets[0].data) : 0;
  const totalValue = data?.datasets?.[0]?.data ? data.datasets[0].data.reduce((a, b) => a + b, 0) : 0;

  return (
    <>
      <div className="uniform-chart-card group">
        {/* Enhanced Header */}
        <div className="card-header">
          <div className="flex items-center">
            <div className="card-icon">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="card-title mobile-title-truncate" title={title}>{title}</h3>
              <div className="flex items-center mt-1">
                <div className="chart-status-indicator success"></div>
                <span className="responsive-text-xs text-gray-500 ml-2">{totalDataPoints} zones •</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="text-right">
              <div className="responsive-text-xl md:text-2xl font-bold text-gray-800">
                {sheetName === 'glitchPercentage' ? `${Math.round(totalValue / totalDataPoints || 0)}%` : totalValue}
              </div>
              {/* <div className="responsive-text-xs text-gray-500">
                {sheetName === 'glitchPercentage' ? 'Avg Coverage' : 'Total Count'}
              </div> */}
            </div>
            <div className="chart-metric-badge">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="hidden sm:inline">Max: </span>{sheetName === 'glitchPercentage' ? `${maxValue}%` : maxValue}
            </div>
          </div>
        </div>

        {/* Chart Container - Mobile Responsive */}
        <div className="chart-container mobile-chart-wrapper">
          <div className="chart-area">
            <Bar ref={chartRef} data={data} options={enhancedOptions} />
          </div>

          {/* Enhanced Click instruction overlay - Mobile Responsive */}
          <div className="click-instruction mobile-click-instruction md:click-instruction">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.121 2.122" />
            </svg>
            <span className="hidden sm:inline">Click bars for detailed view</span>
            <span className="sm:hidden">Tap for details</span>
          </div>
        </div>
      </div>

      {/* Enhanced Detail Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mr-3 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  {selectedDetails.type === 'workshop'
                    ? `Workshop Time: ${selectedDetails.workshopTime} - Zone ${selectedDetails.zone}`
                    : `Zone ${selectedDetails.zone} - ${selectedDetails.title}`}
                </h3>
                <p className="text-sm text-gray-600 mt-1">Detailed breakdown and information</p>
              </div>
              <button
                onClick={() => setSelectedDetails(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Summary Section */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-blue-800">Summary</h4>
                    <p className="text-sm text-blue-600">
                      {selectedDetails.type === 'workshop'
                        ? `Workshop Time: ${selectedDetails.workshopTime}`
                        : `Zone ${selectedDetails.zone} overview`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">
                      {selectedDetails.type === 'percentage' ? `${selectedDetails.total}%` : selectedDetails.total}
                    </div>
                    <div className="text-sm text-blue-500">
                      {selectedDetails.type === 'issue' ? 'Total Issues' :
                       selectedDetails.type === 'percentage' ? 'Route Coverage' :
                       selectedDetails.type === 'vehicleNumbers' ? 'Total Vehicles' :
                       selectedDetails.type === 'vehicleBreakdown' ? 'Vehicle Breakdowns' : 'Total Count'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Coverage Percentage Details */}
              {selectedDetails.type === 'percentage' && selectedDetails.rawData && selectedDetails.rawData.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Route Coverage Details ({selectedDetails.rawData.length} records)
                  </h4>
                  <div className="space-y-4">
                    {selectedDetails.rawData.map((record, index) => (
                      <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200 hover:shadow-md transition-shadow">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Main Percentage Display */}
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Route Coverage</span>
                              <div className="text-3xl font-bold text-purple-600">
                                {record.Percentage || record.Count}%
                              </div>
                            </div>
                            <div className="w-16 h-16 relative">
                              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="#e5e7eb"
                                  strokeWidth="2"
                                />
                                <path
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="#8b5cf6"
                                  strokeWidth="2"
                                  strokeDasharray={`${(record.Percentage || record.Count)}, 100`}
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-semibold text-purple-600">
                                  {Math.round(record.Percentage || record.Count)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Detailed Breakdown */}
                          <div className="space-y-2">
                            {record.SoftwarePercentage !== null && record.SoftwarePercentage !== undefined && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Software %:</span>
                                <span className="text-sm font-semibold text-blue-600">{record.SoftwarePercentage}%</span>
                              </div>
                            )}
                            {record.ActualPercentage !== null && record.ActualPercentage !== undefined && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Actual %:</span>
                                <span className="text-sm font-semibold text-green-600">{record.ActualPercentage}%</span>
                              </div>
                            )}
                            {record.Date && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Date:</span>
                                <span className="text-sm text-gray-600">{new Date(record.Date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Remarks Section */}
                        {record.Remarks && (
                          <div className="mt-4 pt-4 border-t border-purple-200">
                            <span className="text-sm font-medium text-gray-700">Remarks:</span>
                            <p className="mt-1 text-sm text-gray-600">{record.Remarks}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicle Numbers Details */}
              {selectedDetails.type === 'vehicleNumbers' && selectedDetails.rawData && selectedDetails.rawData.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Vehicle Numbers Details ({selectedDetails.rawData.length} records)
                  </h4>
                  <div className="space-y-4">
                    {selectedDetails.rawData.map((record, index) => (
                      <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Date:</span>
                              <span className="text-sm text-gray-600">{new Date(record.Date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Total Vehicles:</span>
                              <span className="text-sm font-semibold text-green-600">{record.TotalVehicles}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Vehicle Numbers:</span>
                              <div className="mt-1 p-2 bg-white rounded border text-sm text-gray-600 break-words">
                                {record.VehicleNumbers || 'Not specified'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}





              {/* Vehicle Breakdown Details */}
              {selectedDetails.type === 'vehicleBreakdown' && selectedDetails.details && selectedDetails.details.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Vehicle Breakdown Details ({selectedDetails.details.length} vehicles)
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {selectedDetails.details.map((detail, index) => (
                      <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-200 hover:shadow-md transition-shadow">
                        <div className="space-y-3">
                          {/* Vehicle Information Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-semibold text-gray-800">
                                {detail.vehicleNo}
                              </span>
                            </div>
                            {detail.spareStatus && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                detail.spareStatus.toLowerCase().includes('ok') || detail.spareStatus.toLowerCase().includes('resolved')
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {detail.spareStatus}
                              </span>
                            )}
                          </div>

                          {/* Breakdown Information */}
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            {detail.breakdownTime && (
                              <div className="flex items-center">
                                <svg className="w-3 h-3 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium text-gray-700">Breakdown Time:</span>
                                <span className="ml-2 text-red-600 font-semibold">{detail.breakdownTime}</span>
                              </div>
                            )}

                            {detail.issue && (
                              <div className="flex items-center">
                                <svg className="w-3 h-3 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span className="font-medium text-gray-700">Issue:</span>
                                <span className="ml-2 text-orange-600">{detail.issue}</span>
                              </div>
                            )}

                            {detail.spareTime && (
                              <div className="flex items-center">
                                <svg className="w-3 h-3 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium text-gray-700">Spare/OK Time:</span>
                                <span className="ml-2 text-blue-600 font-semibold">{detail.spareTime}</span>
                              </div>
                            )}

                            {detail.ward && (
                              <div className="flex items-center">
                                <svg className="w-3 h-3 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="font-medium text-gray-700">Ward:</span>
                                <span className="ml-2 text-purple-600">{detail.ward}</span>
                              </div>
                            )}

                            {detail.date && (
                              <div className="flex items-center">
                                <svg className="w-3 h-3 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="font-medium text-gray-700">Date:</span>
                                <span className="ml-2 text-gray-600">{new Date(detail.date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Issue Breakdown (for issue charts) */}
              {selectedDetails.type === 'issue' && selectedDetails.breakdown && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Issue Breakdown
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(selectedDetails.breakdown).map(([issueType, count]) => (
                      count > 0 && (
                        <div key={issueType} className="flex justify-between items-center p-4 bg-red-50 rounded-lg border border-red-200">
                          <span className="font-medium text-gray-700">{issueType}</span>
                          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {count}
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Timing Data (for fuel station and late vehicle charts) */}
              {selectedDetails.type === 'timing' && selectedDetails.details && selectedDetails.details.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {selectedDetails.sheetName === 'fuelStation' ? 'Fuel Station Visit Details' : 'Late Vehicle Timing Details'} ({selectedDetails.details.length} vehicles)
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {selectedDetails.details.map((detail, index) => (
                      <div key={index} className="p-4 bg-orange-50 rounded-lg border border-orange-200 hover:shadow-md transition-shadow">
                        <div className="space-y-3">
                          {/* Vehicle Information */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-semibold text-gray-800">
                                {detail.vehicleNo || `Vehicle #${index + 1}`}
                              </span>
                            </div>
                            {detail.status && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                detail.status.toLowerCase().includes('ok') || detail.status.toLowerCase().includes('resolved')
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {detail.status}
                              </span>
                            )}
                          </div>

                          {/* Timing Information */}
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            {detail.time && (
                              <div className="flex items-center">
                                <svg className="w-3 h-3 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium text-gray-700">
                                  {selectedDetails.sheetName === 'fuelStation' ? 'Fuel Station Time:' : 'Late Time:'}
                                </span>
                                <span className="ml-2 text-orange-600 font-semibold">{detail.time}</span>
                              </div>
                            )}

                            {detail.breakdownTime && (
                              <div className="flex items-center">
                                <svg className="w-3 h-3 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span className="font-medium text-gray-700">Breakdown Time:</span>
                                <span className="ml-2 text-red-600 font-semibold">{detail.breakdownTime}</span>
                              </div>
                            )}

                            {detail.spareTime && (
                              <div className="flex items-center">
                                <svg className="w-3 h-3 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium text-gray-700">Spare Time:</span>
                                <span className="ml-2 text-blue-600 font-semibold">{detail.spareTime}</span>
                              </div>
                            )}
                          </div>

                          {/* Issue/Reason */}
                          {detail.issue && (
                            <div className="pt-2 border-t border-orange-200">
                              <span className="font-medium text-gray-700">
                                {selectedDetails.sheetName === 'fuelStation' ? 'Reason:' : 'Issue:'}
                              </span>
                              <span className="ml-2 text-gray-600">{detail.issue}</span>
                            </div>
                          )}

                          {/* Additional Status Information */}
                          {detail.spareStatus && detail.spareStatus !== detail.status && (
                            <div className="pt-1">
                              <span className="font-medium text-gray-700">Spare Status:</span>
                              <span className="ml-2 text-gray-600">{detail.spareStatus}</span>
                            </div>
                          )}

                          {/* Remarks */}
                          {detail.remarks && (
                            <div className="pt-2 border-t border-orange-200">
                              <span className="font-medium text-gray-700">Remarks:</span>
                              <p className="mt-1 text-gray-600 text-sm">{detail.remarks}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Data Table (for general charts) */}
              {selectedDetails.type === 'general' && selectedDetails.rawData && selectedDetails.rawData.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Detailed Records ({selectedDetails.rawData.length} entries)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(selectedDetails.rawData[0]).map((key) => (
                            <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedDetails.rawData.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {Object.entries(row).map(([key, value]) => (
                              <td key={key} className="px-4 py-3 text-sm text-gray-900 border-b">
                                {value || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Workshop Exit Details */}
              {selectedDetails.type === 'workshop' && selectedDetails.rawData && selectedDetails.rawData.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Workshop Exit Vehicle Details ({selectedDetails.rawData.length} vehicles)
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {selectedDetails.rawData.map((detail, index) => (
                      <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200 hover:shadow-md transition-shadow">
                        <div className="space-y-3">
                          {/* Vehicle Information Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-semibold text-gray-800">
                                Vehicle #{index + 1}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {detail.Date && new Date(detail.Date).toLocaleDateString()}
                            </div>
                          </div>

                          {/* Vehicle Details Grid */}
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            {detail.Ward && (
                              <div className="flex items-center">
                                <svg className="w-3 h-3 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="font-medium text-gray-700">Ward:</span>
                                <span className="ml-2 text-purple-600 font-semibold">{detail.Ward}</span>
                              </div>
                            )}

                            {detail['Permanent Vehicle Number'] && (
                              <div className="flex items-center">
                                <svg className="w-3 h-3 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="font-medium text-gray-700">Permanent Vehicle:</span>
                                <span className="ml-2 text-blue-600 font-semibold">{detail['Permanent Vehicle Number']}</span>
                              </div>
                            )}

                            {detail['Spare Vehicle Number'] && (
                              <div className="flex items-center">
                                <svg className="w-3 h-3 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="font-medium text-gray-700">Spare Vehicle:</span>
                                <span className="ml-2 text-green-600 font-semibold">{detail['Spare Vehicle Number']}</span>
                              </div>
                            )}

                            {detail['Workshop Departure Time'] && (
                              <div className="flex items-center">
                                <svg className="w-3 h-3 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium text-gray-700">Workshop Departure:</span>
                                <span className="ml-2 text-orange-600 font-semibold">{detail['Workshop Departure Time']}</span>
                              </div>
                            )}

                            {detail.Zone && (
                              <div className="flex items-center">
                                <svg className="w-3 h-3 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="font-medium text-gray-700">Zone:</span>
                                <span className="ml-2 text-indigo-600 font-semibold">{detail.Zone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicle Details (for issue charts with detailed info) */}
              {selectedDetails.details && selectedDetails.details.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Vehicle Details
                  </h4>
                  <div className="space-y-3">
                    {selectedDetails.details.map((detail, index) => (
                      <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {Object.entries(detail).map(([key, value]) => (
                            value && (
                              <div key={key}>
                                <span className="font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <span className="ml-2 text-gray-600">{value}</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback Raw Data for Timing Charts without Details */}
              {selectedDetails.type === 'timing' && (!selectedDetails.details || selectedDetails.details.length === 0) && selectedDetails.rawData && selectedDetails.rawData.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {selectedDetails.sheetName === 'fuelStation' ? 'Fuel Station Records' : 'Late Vehicle Records'} ({selectedDetails.rawData.length} entries)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-orange-50">
                        <tr>
                          {Object.keys(selectedDetails.rawData[0]).map((key) => (
                            <th key={key} className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider border-b">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedDetails.rawData.map((row, index) => (
                          <tr key={index} className="hover:bg-orange-50">
                            {Object.entries(row).map(([key, value]) => (
                              <td key={key} className="px-4 py-3 text-sm text-gray-900 border-b">
                                {typeof value === 'object' && value !== null ? JSON.stringify(value) : (value || '-')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* No Data Message */}
              {((selectedDetails.type === 'general' && (!selectedDetails.rawData || selectedDetails.rawData.length === 0)) ||
                (selectedDetails.type === 'timing' && (!selectedDetails.details || selectedDetails.details.length === 0) && (!selectedDetails.rawData || selectedDetails.rawData.length === 0)) ||
                (selectedDetails.type === 'percentage' && (!selectedDetails.rawData || selectedDetails.rawData.length === 0))) && (
                <div className="text-center text-gray-500 py-8">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium">No detailed data available</p>
                  <p className="text-sm">No records found for Zone {selectedDetails.zone}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Data for Zone {selectedDetails.zone} • {selectedDetails.title}
              </div>
              <button
                onClick={() => setSelectedDetails(null)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BarChart;
