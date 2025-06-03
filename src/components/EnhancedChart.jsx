import React, { useState, useRef, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { enhanceChartData, getEnhancedChartOptions, optimizeChartPerformance } from '../utils/chartEnhancements';
import { getThemedChartColors } from '../utils/themeUtils';

const EnhancedChart = ({ 
  type = 'bar', 
  data, 
  options = {}, 
  title, 
  loading = false, 
  error = null, 
  sheetName = '', 
  rawData = [],
  onDataPointClick = null,
  showMetrics = true,
  className = ''
}) => {
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(loading);
  const [hoveredElement, setHoveredElement] = useState(null);
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

  // Enhanced chart data with theme colors
  const enhancedData = enhanceChartData(data, type);
  
  // Enhanced chart options with theme and performance optimizations
  const enhancedOptions = optimizeChartPerformance(
    getEnhancedChartOptions(options, type)
  );

  // Add click and hover handlers
  enhancedOptions.onClick = (event, elements) => {
    if (elements.length > 0 && onDataPointClick) {
      const elementIndex = elements[0].index;
      const datasetIndex = elements[0].datasetIndex;
      const dataset = enhancedData.datasets[datasetIndex];
      const label = enhancedData.labels[elementIndex];
      const value = dataset.data[elementIndex];
      
      onDataPointClick({
        elementIndex,
        datasetIndex,
        label,
        value,
        dataset,
        rawData,
        sheetName
      });
    }
  };

  enhancedOptions.onHover = (event, elements) => {
    setHoveredElement(elements.length > 0 ? elements[0] : null);
  };

  // Calculate chart metrics
  const totalDataPoints = enhancedData?.labels?.length || 0;
  const maxValue = enhancedData?.datasets?.[0]?.data ? Math.max(...enhancedData.datasets[0].data) : 0;
  const totalValue = enhancedData?.datasets?.[0]?.data ? enhancedData.datasets[0].data.reduce((a, b) => a + b, 0) : 0;
  const avgValue = totalDataPoints > 0 ? Math.round(totalValue / totalDataPoints) : 0;

  // Loading state
  if (isLoading) {
    return (
      <div className={`uniform-chart-card group ${className}`}>
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

  // Error state
  if (error) {
    return (
      <div className={`uniform-chart-card group ${className}`}>
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!enhancedData || !enhancedData.labels || enhancedData.labels.length === 0) {
    return (
      <div className={`uniform-chart-card group ${className}`}>
        <div className="card-header">
          <div className="flex items-center">
            <div className="card-icon bg-gradient-to-br from-gray-400 to-gray-500">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="card-title">{title}</h3>
              <div className="flex items-center mt-1">
                <div className="chart-status-indicator error"></div>
                <span className="text-xs text-gray-500 ml-2">No data available</span>
              </div>
            </div>
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chart icon based on type
  const ChartIcon = type === 'line' ? (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4" />
    </svg>
  ) : (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const ChartComponent = type === 'line' ? Line : Bar;

  return (
    <div className={`uniform-chart-card group ${className}`}>
      {/* Enhanced Header */}
      <div className="card-header">
        <div className="flex items-center">
          <div className="card-icon">
            {ChartIcon}
          </div>
          <div>
            <h3 className="card-title">{title}</h3>
            <div className="flex items-center mt-1">
              <div className="chart-status-indicator success"></div>
              <span className="text-xs text-gray-500 ml-2">
                {totalDataPoints} {type === 'line' ? 'time points' : 'zones'} • Interactive chart
              </span>
            </div>
          </div>
        </div>
        
        {showMetrics && (
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-800">
                {sheetName === 'glitchPercentage' ? `${avgValue}%` : totalValue}
              </div>
              <div className="text-xs text-gray-500">
                {sheetName === 'glitchPercentage' ? 'Avg Coverage' : 'Total Count'}
              </div>
            </div>
            <div className="chart-metric-badge">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Max: {sheetName === 'glitchPercentage' ? `${maxValue}%` : maxValue}
            </div>
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div className="chart-container">
        <div className="chart-area">
          <ChartComponent ref={chartRef} data={enhancedData} options={enhancedOptions} />
        </div>

        {/* Enhanced Click instruction overlay */}
        <div className="click-instruction">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.121 2.122" />
          </svg>
          Click {type === 'line' ? 'points' : 'bars'} for detailed view
        </div>
      </div>
    </div>
  );
};

export default EnhancedChart;
