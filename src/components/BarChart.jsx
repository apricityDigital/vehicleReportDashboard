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

const BarChart = ({ data, options, title, loading = false, error = null, sheetName = '' }) => {
  const [selectedIssueBreakdown, setSelectedIssueBreakdown] = useState(null);
  const isIssueChart = ['issuesPost0710', 'vehicleBreakdown', 'fuelStation', 'post06AMOpenIssues', 'onBoardAfter3PM'].includes(sheetName);

  const handleChartClick = (event, elements) => {
    if (isIssueChart && elements.length > 0) {
      const elementIndex = elements[0].index;
      const datasetIndex = elements[0].datasetIndex;
      const dataset = data.datasets[datasetIndex];
      const label = data.labels[elementIndex];

      if (dataset.issueBreakdowns && dataset.issueBreakdowns[label]) {
        setSelectedIssueBreakdown({
          zone: label,
          breakdown: dataset.issueBreakdowns[label],
          total: dataset.data[elementIndex],
          details: dataset.vehicleDetails ? dataset.vehicleDetails[label] : null
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
        {isIssueChart && (
          <div className="mb-2 text-sm text-gray-600 text-center">
            💡 Click on a bar to see detailed issue breakdown
          </div>
        )}
        <div className="h-80">
          <Bar data={data} options={enhancedOptions} />
        </div>
      </div>

      {/* Issue Breakdown Modal */}
      {selectedIssueBreakdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Zone {selectedIssueBreakdown.zone} - Issue Breakdown
              </h3>
              <button
                onClick={() => setSelectedIssueBreakdown(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-3">
                Total Issues: <span className="font-semibold">{selectedIssueBreakdown.total}</span>
              </div>

              {Object.entries(selectedIssueBreakdown.breakdown).map(([issueType, count]) => (
                count > 0 && (
                  <div key={issueType} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{issueType}</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-semibold">
                      {count}
                    </span>
                  </div>
                )
              ))}

              {/* Show detailed vehicle information for breakdown data */}
              {selectedIssueBreakdown.details && selectedIssueBreakdown.details.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Vehicle Details:</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {selectedIssueBreakdown.details.map((detail, index) => (
                      <div key={index} className="p-3 bg-gray-100 rounded-lg text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          {detail.vehicleNo && (
                            <div><strong>Vehicle:</strong> {detail.vehicleNo}</div>
                          )}
                          <div><strong>Issue/Type:</strong> {detail.issue}</div>

                          {/* Handle different time fields */}
                          {detail.breakdownTime && (
                            <div><strong>Breakdown Time:</strong> {detail.breakdownTime}</div>
                          )}
                          {detail.time && !detail.breakdownTime && (
                            <div><strong>Time:</strong> {detail.time}</div>
                          )}

                          {/* Handle different status fields */}
                          {detail.spareStatus && (
                            <div><strong>Status:</strong> {detail.spareStatus}</div>
                          )}
                          {detail.status && !detail.spareStatus && (
                            <div><strong>Status:</strong> {detail.status}</div>
                          )}

                          {/* Additional time information */}
                          {detail.spareTime && (
                            <div className="col-span-2"><strong>Spare Time:</strong> {detail.spareTime}</div>
                          )}

                          {/* Remarks */}
                          {detail.remarks && (
                            <div className="col-span-2"><strong>Remarks:</strong> {detail.remarks}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.values(selectedIssueBreakdown.breakdown).every(count => count === 0) && (
                <div className="text-center text-gray-500 py-4">
                  No detailed breakdown available
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedIssueBreakdown(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
