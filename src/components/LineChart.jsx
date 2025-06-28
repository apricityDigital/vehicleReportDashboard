import React, { useState, useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getCurrentTheme, getThemedChartColors } from '../utils/themeUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const LineChart = ({ data, options, title, loading = false, error = null, sheetName = '', rawData = [] }) => {
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(loading);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const chartRef = useRef(null);
  const [themeColors, setThemeColors] = useState(getThemedChartColors());

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

      // For workshop charts, label is workshop departure time
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
    }
  };

  const enhancedOptions = {
    ...options,
    onClick: handleChartClick
  };

  if (loading) {
    return (
      <div className="uniform-chart-card group">
        <div className="chart-container">
          <div className="chart-area flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading {title}...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="uniform-chart-card group">
        <div className="chart-container">
          <div className="chart-area flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium">Error loading {title}</p>
              <p className="text-gray-500 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <div className="uniform-chart-card group">
        <div className="chart-container">
          <div className="chart-area flex items-center justify-center">
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
      </div>
    );
  }

  return (
    <>
      <div className="uniform-chart-card group">
        {/* Enhanced Header */}
        <div className="card-header">
          <div className="flex items-center">
            <div className="card-icon">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="card-title mobile-title-truncate" title={title}>{title}</h3>
              <div className="flex items-center mt-1">
                <div className="chart-status-indicator success"></div>
                <span className="responsive-text-xs text-gray-500 ml-2">Workshop data </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="chart-metric-badge">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">Time-based</span>
              <span className="sm:hidden">Time</span>
            </div>
          </div>
        </div>

        {/* Chart Container - Mobile Responsive */}
        <div className="chart-container mobile-chart-wrapper">
          <div className="chart-area">
            <Line data={data} options={enhancedOptions} />
          </div>

          {/* Click instruction overlay - Mobile Responsive */}
          <div className="click-instruction mobile-click-instruction md:click-instruction">
            <svg className="w-4 h-4 mr-1 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.121 2.122" />
            </svg>
            <span className="hidden sm:inline">Click points for details</span>
            <span className="sm:hidden">Tap for details</span>
          </div>
        </div>
      </div>

      {/* Enhanced Detail Modal - Mobile Responsive */}
      {selectedDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg mr-2 sm:mr-3 flex items-center justify-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="truncate">
                    Workshop Time: {selectedDetails.workshopTime} - Zone {selectedDetails.zone}
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-purple-600 mt-1">Vehicle departure details</p>
              </div>
              <button
                onClick={() => setSelectedDetails(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors touch-manipulation mt-2 sm:mt-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Summary Section */}
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-purple-800">Summary</h4>
                    <p className="text-sm text-purple-600">Workshop Time: {selectedDetails.workshopTime}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-purple-600">Zone {selectedDetails.zone}</div>
                    <div className="text-sm text-purple-500">Departure Zone</div>
                  </div>
                </div>
              </div>

              {/* Workshop Exit Details */}
              {selectedDetails.rawData && selectedDetails.rawData.length > 0 && (
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

              {/* No Data Message */}
              {(!selectedDetails.rawData || selectedDetails.rawData.length === 0) && (
                <div className="text-center text-gray-500 py-8">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium">No detailed data available</p>
                  <p className="text-sm">No records found for this time point</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Workshop Time: {selectedDetails.workshopTime} • Zone {selectedDetails.zone}
              </div>
              <button
                onClick={() => setSelectedDetails(null)}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
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

export default LineChart;
