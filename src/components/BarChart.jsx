import React, { useState } from 'react';
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
  const isIssueChart = ['issuesPost0710', 'vehicleBreakdown', 'fuelStation', 'post06AMOpenIssues'].includes(sheetName);

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
  };

  const enhancedOptions = {
    ...options,
    onClick: handleChartClick
  };

  if (loading) {
    return (
      <div className="card">
        <div className="h-80 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading {title}...</p>
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
            <p className="text-red-600 font-medium">Error loading {title}</p>
            <p className="text-gray-500 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <div className="card">
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
    <>
      <div className="card">
        <div className="mb-2 text-sm text-gray-600 text-center flex items-center justify-center">
          <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.121 2.122" />
          </svg>
          Click on any bar to see detailed information
        </div>
        <div className="h-80">
          <Bar data={data} options={enhancedOptions} />
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
                  Zone {selectedDetails.zone} - {selectedDetails.title}
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
                    <p className="text-sm text-blue-600">Zone {selectedDetails.zone} overview</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">{selectedDetails.total}</div>
                    <div className="text-sm text-blue-500">
                      {selectedDetails.type === 'issue' ? 'Total Issues' : 'Total Count'}
                    </div>
                  </div>
                </div>
              </div>

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

              {/* No Data Message */}
              {selectedDetails.type === 'general' && (!selectedDetails.rawData || selectedDetails.rawData.length === 0) && (
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
