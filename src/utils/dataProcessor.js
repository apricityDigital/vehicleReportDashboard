import { format } from 'date-fns';

// Get current date in YYYY-MM-DD format
export const getCurrentDate = () => {
  return format(new Date(), 'yyyy-MM-dd');
};

// Normalize date format to handle different date formats
const normalizeDate = (dateStr) => {
  if (!dateStr) return '';

  // Handle different date formats
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return dateStr; // Return original if can't parse
  }

  return format(date, 'yyyy-MM-dd');
};

// Filter data by date, zone, and trip count (for lessThan3Trips sheet)
export const filterData = (data, selectedDate, selectedZone, tripCountFilter = null) => {
  if (!data || data.length === 0) {
    return [];
  }

  const filtered = data.filter(row => {
    // Normalize dates for comparison
    const rowDate = normalizeDate(row.Date);
    const filterDate = normalizeDate(selectedDate);

    const dateMatch = !selectedDate || rowDate === filterDate;
    const zoneMatch = !selectedZone || String(row.Zone) === String(selectedZone);

    // Apply trip count filter for lessThan3Trips data
    let tripCountMatch = true;
    if (tripCountFilter !== null && tripCountFilter !== 'all' && row.TripCount0 !== undefined) {
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
        default:
          tripCountMatch = true; // Show all vehicles with <3 trips
          break;
      }
    }

    return dateMatch && zoneMatch && tripCountMatch;
  });

  return filtered;
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
    vehicleBreakdown: 'Breakdowns',
    vehicleNumbers: 'Vehicle Numbers',
    workshopDeparture: 'Workshop Departures'
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
    },
    vehicleNumbers: {
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
      borderColor: 'rgba(16, 185, 129, 1)',
      hoverBackgroundColor: 'rgba(16, 185, 129, 0.9)'
    },
    workshopDeparture: {
      backgroundColor: 'rgba(139, 92, 246, 0.8)',
      borderColor: 'rgba(139, 92, 246, 1)',
      hoverBackgroundColor: 'rgba(139, 92, 246, 0.9)'
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
  const isIssueChart = ['issuesPost0710', 'vehicleBreakdown', 'fuelStation', 'post06AMOpenIssues'].includes(sheetName);
  const isWorkshopDepartureChart = sheetName === 'workshopDeparture';

  if (isLessThan3TripsChart && tripCountFilter && tripCountFilter !== 'all') {
    // Special handling for lessThan3Trips with specific trip count filter
    const groupedData = {};
    const groupedRemarks = {};

    data.forEach((row) => {
      const label = row[labelField] || 'Unknown';

      // Filter out negative zones
      const zoneNumber = Number(label);
      if (!isNaN(zoneNumber) && zoneNumber <= 0) {
        return; // Skip negative zones
      }

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
  } else if (isIssueChart) {
    // Special handling for issue charts with breakdown data
    const groupedData = {};
    const issueBreakdowns = {};
    const vehicleDetails = {};

    data.forEach(item => {
      const label = item[labelField];
      const value = parseFloat(item[valueField]) || 0;

      // Filter out negative zones
      const zoneNumber = Number(label);
      if (!isNaN(zoneNumber) && zoneNumber <= 0) {
        return; // Skip negative zones
      }

      if (groupedData[label]) {
        groupedData[label] += value;
      } else {
        groupedData[label] = value;
      }

      // Store issue breakdown for tooltips
      if (item.IssueBreakdown) {
        if (!issueBreakdowns[label]) {
          issueBreakdowns[label] = {};
        }

        Object.keys(item.IssueBreakdown).forEach(issueType => {
          if (!issueBreakdowns[label][issueType]) {
            issueBreakdowns[label][issueType] = 0;
          }
          issueBreakdowns[label][issueType] += item.IssueBreakdown[issueType] || 0;
        });
      }

      // Store vehicle details for breakdown charts
      if (item.Details && item.Details.length > 0) {
        if (!vehicleDetails[label]) {
          vehicleDetails[label] = [];
        }
        vehicleDetails[label] = vehicleDetails[label].concat(item.Details);
      }
    });

    const labels = Object.keys(groupedData).sort((a, b) => {
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
        borderSkipped: false,
        issueBreakdowns: issueBreakdowns, // Store breakdown data for tooltips
        vehicleDetails: vehicleDetails // Store vehicle details for breakdown charts
      }]
    };
  } else if (isWorkshopDepartureChart) {
    // Special handling for workshop departure data to preserve vehicle details
    const groupedData = {};
    const vehicleDetails = {};

    data.forEach(item => {
      const label = item[labelField];
      const value = parseFloat(item[valueField]) || 0;

      // Filter out negative zones
      const zoneNumber = Number(label);
      if (!isNaN(zoneNumber) && zoneNumber <= 0) {
        return; // Skip negative zones
      }

      if (groupedData[label]) {
        groupedData[label] += value;
      } else {
        groupedData[label] = value;
      }

      // Store vehicle details for workshop departure charts
      if (!vehicleDetails[label]) {
        vehicleDetails[label] = [];
      }
      vehicleDetails[label].push(item);
    });

    const labels = Object.keys(groupedData).sort((a, b) => {
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
        borderSkipped: false,
        vehicleDetails: vehicleDetails // Store vehicle details for workshop departure charts
      }]
    };
  } else if (isPercentageChart) {
    // Special handling for percentage charts with dual data
    const groupedSoftware = {};
    const groupedActual = {};
    const groupedRemarks = {};

    data.forEach((row) => {
      const label = row[labelField] || 'Unknown';

      // Filter out negative zones
      const zoneNumber = Number(label);
      if (!isNaN(zoneNumber) && zoneNumber <= 0) {
        return; // Skip negative zones
      }

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

  // Debug logging for onBoardAfter3PM
  if (sheetName === 'onBoardAfter3PM') {
    console.log('\n=== PROCESSING onBoardAfter3PM DATA ===');
    console.log('Input data:', data);
    console.log('Value field:', valueField);
    console.log('Label field:', labelField);
  }

  data.forEach((row) => {
    const label = row[labelField] || 'Unknown';

    // Filter out negative zones
    const zoneNumber = Number(label);
    if (!isNaN(zoneNumber) && zoneNumber <= 0) {
      return; // Skip negative zones
    }

    const rawValue = row[valueField];
    const value = parseInt(rawValue) || 0;
    const remarks = row.Remarks || '';

    // Debug logging for onBoardAfter3PM
    if (sheetName === 'onBoardAfter3PM') {
      console.log(`Processing row - Zone: ${label}, Raw Value: ${rawValue}, Parsed Value: ${value}`);
    }

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

  // Debug logging for onBoardAfter3PM
  if (sheetName === 'onBoardAfter3PM') {
    console.log('Grouped data:', groupedData);
    console.log('=== END PROCESSING onBoardAfter3PM DATA ===\n');
  }

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
  // Special case for route percent coverage chart which shows percentages
  if (sheetName === 'glitchPercentage') {
    return {
      xLabel: 'Zones',
      yLabel: 'Route Coverage (%)'
    };
  }

  // All other charts use standard vehicle count labels
  return {
    xLabel: 'Zones',
    yLabel: 'Number of Vehicles'
  };
};

// Get chart configuration for different metrics
export const getChartConfig = (title, sheetName) => {
  const axisLabels = getAxisLabels(sheetName);
  const isPercentageChart = sheetName === 'glitchPercentage';
  const isIssueChart = ['issuesPost0710', 'vehicleBreakdown', 'fuelStation', 'post06AMOpenIssues'].includes(sheetName);

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
          },
          afterBody: function(context) {
            if (isIssueChart && context.length > 0) {
              const datasetIndex = context[0].datasetIndex;
              const dataset = context[0].chart.data.datasets[datasetIndex];
              const label = context[0].label;

              if (dataset.issueBreakdowns && dataset.issueBreakdowns[label]) {
                const breakdown = dataset.issueBreakdowns[label];
                const lines = ['', 'Issue Breakdown:'];

                Object.keys(breakdown).forEach(issueType => {
                  const count = breakdown[issueType];
                  if (count > 0) {
                    lines.push(`${issueType}: ${count}`);
                  }
                });

                return lines.length > 2 ? lines : [];
              }
            }
            return [];
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
  onBoardAfter3PM: 'Vehicle on Route after 3:00 PM',
  lessThan3Trips: 'Vehicles with Less than 3 Trips',
  glitchPercentage: 'Route Percent Coverage',
  issuesPost0710: 'Vehicle Starting after 7:10AM',
  fuelStation: 'Vehicles Going to Fuel Station',
  post06AMOpenIssues: 'Vehicles Leaving Zone After 6PM',
  vehicleBreakdown: 'Vehicle Breakdown Information',
  vehicleNumbers: 'Vehicle Number with Zone Wise Breakdown',
  workshopDeparture: 'Sphere Vehicles Exit Late from the Workshop'
};

// Get value field for each sheet type
export const getValueField = (sheetName) => {
  // All sheets now use 'Count' as the standardized value field
  return 'Count';
};
