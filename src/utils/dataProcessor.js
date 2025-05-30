import { format } from 'date-fns';

// Get current date in YYYY-MM-DD format
export const getCurrentDate = () => {
  return format(new Date(), 'yyyy-MM-dd');
};

// Filter data by date, zone, and trip count (for lessThan3Trips sheet)
export const filterData = (data, selectedDate, selectedZone, tripCountFilter = null) => {
  if (!data || data.length === 0) return [];

  return data.filter(row => {
    const dateMatch = !selectedDate || row.Date === selectedDate;
    const zoneMatch = !selectedZone || row.Zone === selectedZone;

    // Apply trip count filter for lessThan3Trips data
    let tripCountMatch = true;
    if (tripCountFilter !== null && row.TripCount0 !== undefined) {
      switch (tripCountFilter) {
        case '0':
          tripCountMatch = row.TripCount0 > 0;
          break;
        case '1':
          tripCountMatch = row.TripCount1 > 0;
          break;
        case '2':
          tripCountMatch = row.TripCount2 > 0;
          break;
        case 'all':
        default:
          tripCountMatch = true; // Show all vehicles with <3 trips
          break;
      }
    }

    return dateMatch && zoneMatch && tripCountMatch;
  });
};

// Get dataset label based on sheet type
const getDatasetLabel = (sheetName) => {
  const labelMapping = {
    onRouteVehicles: 'Vehicles On Route',
    onBoardAfter3PM: 'Vehicles On Board',
    lessThan3Trips: 'Underutilized Vehicles',
    glitchPercentage: 'Software Glitch Rate',
    issuesPost0710: 'Late Arrivals',
    fuelStation: 'Fuel Visits',
    post06AMOpenIssues: 'Late Departures',
    vehicleBreakdown: 'Breakdowns'
  };

  return labelMapping[sheetName] || 'Vehicle Count';
};

// Get color scheme based on sheet type
const getChartColors = (sheetName) => {
  const colorSchemes = {
    onRouteVehicles: {
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
      borderColor: 'rgba(34, 197, 94, 1)',
      hoverBackgroundColor: 'rgba(34, 197, 94, 0.9)'
    },
    onBoardAfter3PM: {
      backgroundColor: 'rgba(251, 191, 36, 0.8)',
      borderColor: 'rgba(251, 191, 36, 1)',
      hoverBackgroundColor: 'rgba(251, 191, 36, 0.9)'
    },
    lessThan3Trips: {
      backgroundColor: 'rgba(239, 68, 68, 0.8)',
      borderColor: 'rgba(239, 68, 68, 1)',
      hoverBackgroundColor: 'rgba(239, 68, 68, 0.9)'
    },
    glitchPercentage: {
      backgroundColor: 'rgba(168, 85, 247, 0.8)',
      borderColor: 'rgba(168, 85, 247, 1)',
      hoverBackgroundColor: 'rgba(168, 85, 247, 0.9)'
    },
    issuesPost0710: {
      backgroundColor: 'rgba(245, 101, 101, 0.8)',
      borderColor: 'rgba(245, 101, 101, 1)',
      hoverBackgroundColor: 'rgba(245, 101, 101, 0.9)'
    },
    fuelStation: {
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)'
    },
    post06AMOpenIssues: {
      backgroundColor: 'rgba(249, 115, 22, 0.8)',
      borderColor: 'rgba(249, 115, 22, 1)',
      hoverBackgroundColor: 'rgba(249, 115, 22, 0.9)'
    },
    vehicleBreakdown: {
      backgroundColor: 'rgba(220, 38, 38, 0.8)',
      borderColor: 'rgba(220, 38, 38, 1)',
      hoverBackgroundColor: 'rgba(220, 38, 38, 0.9)'
    }
  };

  return colorSchemes[sheetName] || {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderColor: 'rgba(59, 130, 246, 1)',
    hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)'
  };
};

// Process data for bar charts
export const processDataForChart = (data, valueField, labelField = 'Zone', sheetName = '', tripCountFilter = null) => {
  if (!data || data.length === 0) {
    const colors = getChartColors(sheetName);
    return {
      labels: [],
      datasets: [{
        label: getDatasetLabel(sheetName),
        data: [],
        ...colors,
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false
      }]
    };
  }

  const isPercentageChart = sheetName === 'glitchPercentage';
  const isLessThan3TripsChart = sheetName === 'lessThan3Trips';

  if (isLessThan3TripsChart && tripCountFilter && tripCountFilter !== 'all') {
    // Special handling for lessThan3Trips with specific trip count filter
    const groupedData = {};
    const groupedRemarks = {};

    data.forEach((row) => {
      const label = row[labelField] || 'Unknown';
      let value = 0;

      // Get the specific trip count based on filter
      switch (tripCountFilter) {
        case '0':
          value = row.TripCount0 || 0;
          break;
        case '1':
          value = row.TripCount1 || 0;
          break;
        case '2':
          value = row.TripCount2 || 0;
          break;
      }

      const remarks = row.Remarks || '';

      if (groupedData[label]) {
        groupedData[label] += value;
        // Combine remarks
        if (remarks && !groupedRemarks[label].includes(remarks)) {
          groupedRemarks[label] += '; ' + remarks;
        }
      } else {
        groupedData[label] = value;
        groupedRemarks[label] = remarks;
      }
    });

    const labels = Object.keys(groupedData).sort((a, b) => {
      // Sort numerically if possible, otherwise alphabetically
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });

    const values = labels.map(label => groupedData[label]);
    const colors = getChartColors(sheetName);

    return {
      labels,
      datasets: [{
        label: `Vehicles with ${tripCountFilter} Trip${tripCountFilter === '1' ? '' : 's'}`,
        data: values,
        ...colors,
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false
      }]
    };
  } else if (isPercentageChart) {
    // Special handling for percentage charts with dual data
    const groupedSoftware = {};
    const groupedActual = {};
    const groupedRemarks = {};

    data.forEach((row) => {
      const label = row[labelField] || 'Unknown';
      const softwarePercentage = row.SoftwarePercentage || 0;
      const actualPercentage = row.ActualPercentage || 0;
      const remarks = row.Remarks || '';

      if (groupedSoftware[label]) {
        // For percentage data, take the latest value (or average if needed)
        groupedSoftware[label] = softwarePercentage;
        groupedActual[label] = actualPercentage;
        // Combine remarks
        if (remarks && !groupedRemarks[label].includes(remarks)) {
          groupedRemarks[label] += '; ' + remarks;
        }
      } else {
        groupedSoftware[label] = softwarePercentage;
        groupedActual[label] = actualPercentage;
        groupedRemarks[label] = remarks;
      }
    });

    const labels = Object.keys(groupedSoftware).sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });

    const softwareValues = labels.map(label => ({
      x: label,
      y: groupedSoftware[label],
      remarks: groupedRemarks[label]
    }));

    const actualValues = labels.map(label => ({
      x: label,
      y: groupedActual[label],
      remarks: groupedRemarks[label]
    }));

    // Check if we have both software and actual data
    const hasBothDatasets = data.some(row => row.SoftwarePercentage && row.ActualPercentage);

    if (hasBothDatasets) {
      return {
        labels,
        datasets: [
          {
            label: 'Software Glitch Rate',
            data: softwareValues,
            backgroundColor: 'rgba(168, 85, 247, 0.8)',
            borderColor: 'rgba(168, 85, 247, 1)',
            hoverBackgroundColor: 'rgba(168, 85, 247, 0.9)',
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false
          },
          {
            label: 'Actual Performance Rate',
            data: actualValues,
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgba(34, 197, 94, 1)',
            hoverBackgroundColor: 'rgba(34, 197, 94, 0.9)',
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false
          }
        ]
      };
    } else {
      // Single dataset for software percentage only
      const colors = getChartColors(sheetName);
      return {
        labels,
        datasets: [{
          label: getDatasetLabel(sheetName),
          data: softwareValues,
          ...colors,
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false
        }]
      };
    }
  }

  // Regular processing for non-percentage charts
  const groupedData = {};
  const groupedRemarks = {};

  data.forEach((row) => {
    const label = row[labelField] || 'Unknown';
    const rawValue = row[valueField];
    const value = parseInt(rawValue) || 0;
    const remarks = row.Remarks || '';

    if (groupedData[label]) {
      groupedData[label] += value;
      // Combine remarks
      if (remarks && !groupedRemarks[label].includes(remarks)) {
        groupedRemarks[label] += '; ' + remarks;
      }
    } else {
      groupedData[label] = value;
      groupedRemarks[label] = remarks;
    }
  });

  const labels = Object.keys(groupedData).sort((a, b) => {
    // Sort numerically if possible, otherwise alphabetically
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b);
  });

  const values = labels.map(label => groupedData[label]);
  const colors = getChartColors(sheetName);

  return {
    labels,
    datasets: [{
      label: getDatasetLabel(sheetName),
      data: values,
      ...colors,
      borderWidth: 2,
      borderRadius: 4,
      borderSkipped: false
    }]
  };
};

// Get metric-specific axis labels
const getAxisLabels = (sheetName) => {
  const axisConfig = {
    onRouteVehicles: {
      xLabel: 'Vehicle Zones',
      yLabel: 'Number of Vehicles On Route'
    },
    onBoardAfter3PM: {
      xLabel: 'Vehicle Zones',
      yLabel: 'Vehicles Still On Board'
    },
    lessThan3Trips: {
      xLabel: 'Vehicle Zones',
      yLabel: 'Vehicles with <3 Trips'
    },
    glitchPercentage: {
      xLabel: 'Vehicle Zones',
      yLabel: 'Glitch Percentage (%)'
    },
    issuesPost0710: {
      xLabel: 'Vehicle Zones',
      yLabel: 'Late Arrival Count'
    },
    fuelStation: {
      xLabel: 'Vehicle Zones',
      yLabel: 'Fuel Station Visits'
    },
    post06AMOpenIssues: {
      xLabel: 'Vehicle Zones',
      yLabel: 'Late Departure Count'
    },
    vehicleBreakdown: {
      xLabel: 'Vehicle Zones',
      yLabel: 'Breakdown Count'
    }
  };

  return axisConfig[sheetName] || {
    xLabel: 'Vehicle Zones',
    yLabel: 'Vehicle Count'
  };
};

// Get chart configuration for different metrics
export const getChartConfig = (title, sheetName) => {
  const axisLabels = getAxisLabels(sheetName);
  const isPercentageChart = sheetName === 'glitchPercentage';

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'rect'
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
          family: 'Inter, system-ui, sans-serif'
        },
        padding: {
          bottom: 20
        },
        color: '#1f2937'
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f9fafb',
        bodyColor: '#f9fafb',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        padding: 12,
        callbacks: {
          title: function(context) {
            return `Zone ${context[0].label}`;
          },
          label: function(context) {
            const datasetLabel = context.dataset.label || '';
            const value = context.parsed.y;

            if (isPercentageChart) {
              return `${datasetLabel}: ${value.toFixed(1)}%`;
            }
            return `${datasetLabel}: ${value}`;
          },
          afterLabel: function(context) {
            // Add remarks for glitch percentage chart if available
            if (isPercentageChart && context.raw && typeof context.raw === 'object' && context.raw.remarks) {
              return `Note: ${context.raw.remarks}`;
            }
            return '';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: isPercentageChart ? 100 : undefined,
        ticks: {
          stepSize: isPercentageChart ? 10 : 1,
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#6b7280',
          callback: function(value) {
            if (isPercentageChart) {
              return value + '%';
            }
            return value;
          }
        },
        title: {
          display: true,
          text: axisLabels.yLabel,
          font: {
            size: 12,
            weight: 'bold',
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#374151',
          padding: {
            bottom: 10
          }
        },
        grid: {
          color: '#f3f4f6',
          lineWidth: 1
        },
        border: {
          color: '#e5e7eb'
        }
      },
      x: {
        title: {
          display: true,
          text: axisLabels.xLabel,
          font: {
            size: 12,
            weight: 'bold',
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#374151',
          padding: {
            top: 10
          }
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#6b7280'
        },
        grid: {
          display: false
        },
        border: {
          color: '#e5e7eb'
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    },
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      }
    }
  };
};

// Chart titles mapping
export const CHART_TITLES = {
  onRouteVehicles: 'On Route Vehicles',
  onBoardAfter3PM: 'Vehicles on Board after 3PM',
  lessThan3Trips: 'Vehicles with Less than 3 Trips',
  glitchPercentage: 'Glitch Percentage Report',
  issuesPost0710: 'Vehicles Arriving After 07:10',
  fuelStation: 'Vehicles Going to Fuel Station',
  post06AMOpenIssues: 'Vehicles Leaving Zone After 6PM',
  vehicleBreakdown: 'Vehicle Breakdown Information'
};

// Get value field for each sheet type
export const getValueField = (sheetName) => {
  // All sheets now use 'Count' as the standardized value field
  return 'Count';
};
