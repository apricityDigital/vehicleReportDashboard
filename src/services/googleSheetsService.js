// Google Sheets service for fetching data
const SPREADSHEET_ID = '1DsDk17Vyf2zj5kxr86JPVhYZ04ZstY0IAH7La4UeVa0';

// Sheet GIDs for different reports
const SHEET_GIDS = {
  onRouteVehicles: '0',
  onBoardAfter3PM: '1335240771',
  lessThan3Trips: '1474814226',
  glitchPercentage: '1163492617',
  issuesPost0710: '203626227',
  fuelStation: '431461673',
  post06AMOpenIssues: '1903869379',
  vehicleBreakdown: '213524255',
  vehicleNumbers: '510665731',
  sphereWorkshopExit: '291765477'
};

// Convert Google Sheets to CSV URL
const getSheetCSVUrl = (gid) => {
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
};

// Enhanced CSV parser with better handling of malformed Google Sheets data
const parseCSV = (csvText) => {
  console.log('🔍 CSV Parser - Input length:', csvText.length);
  console.log('🔍 CSV Parser - Contains newlines:', csvText.includes('\n'));
  console.log('🔍 CSV Parser - Contains dates:', csvText.includes('2025-'));

  // Handle different line break formats and fix malformed CSV
  let normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Special handling for Google Sheets CSV that comes as one line with space-separated rows
  if (!normalizedText.includes('\n') && normalizedText.includes('2025-')) {
    console.log('⚠️  Detected single-line CSV format - applying fix');

    // Handle the specific format where header and data are separated

    // More robust pattern matching for header extraction
    // Look for the last comma before the first date
    const firstDateIndex = normalizedText.search(/\d{4}-\d{2}-\d{2}/);
    if (firstDateIndex > 0) {
      // Find the last comma before the first date
      const headerPart = normalizedText.substring(0, firstDateIndex);
      const lastCommaIndex = headerPart.lastIndexOf(',');

      if (lastCommaIndex > 0) {
        // Split at the last comma before the date
        const header = normalizedText.substring(0, lastCommaIndex + 1).trim();
        const dataSection = normalizedText.substring(lastCommaIndex + 1).trim();

        console.log('📋 Extracted header:', header);
        console.log('📊 Data section preview:', dataSection.substring(0, 100) + '...');

        // Split data section by date pattern (but keep the dates)
        const dataRows = dataSection.split(/(?=\d{4}-\d{2}-\d{2})/).filter(row => row.trim());

        console.log('📊 Found data rows:', dataRows.length);

        // Reconstruct with proper line breaks
        normalizedText = header + '\n' + dataRows.join('\n');
      } else {
        // Last resort: Split by date pattern
        normalizedText = normalizedText.replace(/(\d{4}-\d{2}-\d{2})/g, '\n$1');
        normalizedText = normalizedText.replace(/^\n/, '');
      }
    }

    console.log('✅ Fixed CSV format - new line count:', normalizedText.split('\n').length);
  }

  const lines = normalizedText.split('\n');
  if (lines.length === 0) return [];



  // Parse CSV line with proper quote handling
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]).map(header => header.replace(/"/g, '').trim());

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = parseCSVLine(lines[i]).map(value => value.replace(/"/g, '').trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
  }

  return data;
};

// Transform wide format data to long format
const transformWideToLong = (data) => {
  const longData = [];

  data.forEach(row => {
    const date = normalizeDate(row.Date);
    Object.keys(row).forEach(key => {
      if (key !== 'Date' && key.startsWith('Zone ')) {
        const zone = key.replace('Zone ', '');
        const value = parseInt(row[key]) || 0;
        // Include all values, including 0, for complete data representation
        longData.push({
          Date: date,
          Zone: zone,
          Count: value
        });
      }
    });
  });

  return longData;
};

// Transform data with multiple count columns to standardized format
const transformMultiColumnData = (data) => {
  const longData = [];

  data.forEach(row => {
    const date = row.Date;
    let zone = row.Zone;

    // Extract zone number from zone names like "Zone 1 - Kila Maidan" or "Zone -1"
    if (zone) {
      const zoneMatch = zone.match(/Zone\s*(-?\d+)/);
      if (zoneMatch) {
        zone = zoneMatch[1];
      }
    }

    // Sum up all count columns for this row
    let totalCount = 0;
    Object.keys(row).forEach(key => {
      if (key !== 'Date' && key !== 'Zone' && !isNaN(parseInt(row[key]))) {
        totalCount += parseInt(row[key]) || 0;
      }
    });

    if (totalCount > 0) {
      longData.push({
        Date: date,
        Zone: zone,
        Count: totalCount
      });
    }
  });

  return longData;
};

// Transform vehicle breakdown data to preserve detailed breakdown information
const transformVehicleBreakdownData = (data) => {
  const longData = [];
  const zoneBreakdowns = {};
 console.log("on route vehicles breakdown information ", data);
  data.forEach(row => {
    const date = normalizeDate(row.Date);
    let zone = row.Zone;
    const issue = row.Issue || '';
    const vehicleNo = row['Vehicle No.'] || '';
    const breakdownTime = row['Breakdown Time'] || '';
    const spareStatus = row['Spare/OK'] || '';
    const spareTime = row['Spare/OK Time'] || '';

    // Skip empty rows
    if (!date || !zone || !issue) return;

    // Ensure zone is a string for consistency
    zone = String(zone);

    // Initialize zone breakdown if not exists
    if (!zoneBreakdowns[zone]) {
      zoneBreakdowns[zone] = {
        Date: date,
        Zone: zone,
        Count: 0,
        IssueBreakdown: {},
        Details: []
      };
    }

    // Increment count
    zoneBreakdowns[zone].Count += 1;

    // Track issue types
    if (!zoneBreakdowns[zone].IssueBreakdown[issue]) {
      zoneBreakdowns[zone].IssueBreakdown[issue] = 0;
    }
    zoneBreakdowns[zone].IssueBreakdown[issue] += 1;

    // Store detailed information
    zoneBreakdowns[zone].Details.push({
      vehicleNo,
      issue,
      breakdownTime,
      spareStatus,
      spareTime
    });
  });

  // Convert to array format
  Object.values(zoneBreakdowns).forEach(zoneData => {
    if (zoneData.Count > 0) {
      longData.push(zoneData);
    }
  });

  return longData;
};

// Transform fuel station data with specific timing information
const transformFuelStationData = (data) => {
  const longData = [];

  data.forEach(row => {
    const date = normalizeDate(row.Date);
    let zone = row.Zone;
    const fuelStationTimes = row['Fuel Station Times'] || '';
    const vehicleCount = parseInt(row['Count of Vehicles']) || 0;

    // Skip empty rows
    if (!date || !zone || vehicleCount === 0) return;

    // Extract zone number from zone names like "Zone -3" or "Zone 5"
    if (zone) {
      const zoneMatch = zone.match(/Zone\s*(-?\d+)/);
      if (zoneMatch) {
        zone = Math.abs(parseInt(zoneMatch[1])); // Convert to positive number
      }
    }

    // Parse fuel station times (comma-separated)
    const times = fuelStationTimes.split(',').map(time => time.trim()).filter(time => time);

    // Create individual vehicle details from times
    const details = [];
    times.forEach((time, index) => {
      details.push({
        vehicleNo: `Vehicle ${index + 1}`, // Generate vehicle numbers since not provided
        time: time,
        issue: 'Fuel Station Visit',
        status: 'Completed',
        remarks: `Fuel station visit at ${time}`
      });
    });

    // Add any remaining vehicles if count is higher than times provided
    for (let i = times.length; i < vehicleCount; i++) {
      details.push({
        vehicleNo: `Vehicle ${i + 1}`,
        time: 'Time not specified',
        issue: 'Fuel Station Visit',
        status: 'Completed',
        remarks: 'Fuel station visit - time not recorded'
      });
    }

    longData.push({
      Date: date,
      Zone: String(zone),
      Count: vehicleCount,
      FuelStationTimes: fuelStationTimes,
      Details: details
    });
  });

  return longData;
};

// Transform late vehicle data (for after 6pm, after 7pm) to preserve detailed information
const transformLateVehicleData = (data) => {
  const longData = [];
  const zoneBreakdowns = {};

  data.forEach(row => {
    const date = normalizeDate(row.Date);
    let zone = row.Zone;

    // Handle different possible column names for vehicle information
    const vehicleNo = row['Vehicle No.'] || row['Vehicle Number'] || row['Vehicle'] || '';
    const issue = row.Issue || row.Reason || row.Type || 'Late Vehicle';
    const time = row.Time || row['Late Time'] || row['Arrival Time'] || row['Departure Time'] || '';
    const status = row.Status || row['Spare/OK'] || '';
    const remarks = row.Remarks || row.Notes || '';

    // Skip empty rows
    if (!date || !zone) return;

    // Ensure zone is a string for consistency
    zone = String(zone);

    // Initialize zone breakdown if not exists
    if (!zoneBreakdowns[zone]) {
      zoneBreakdowns[zone] = {
        Date: date,
        Zone: zone,
        Count: 0,
        IssueBreakdown: {},
        Details: []
      };
    }

    // Increment count
    zoneBreakdowns[zone].Count += 1;

    // Track issue types
    if (!zoneBreakdowns[zone].IssueBreakdown[issue]) {
      zoneBreakdowns[zone].IssueBreakdown[issue] = 0;
    }
    zoneBreakdowns[zone].IssueBreakdown[issue] += 1;

    // Store detailed information
    zoneBreakdowns[zone].Details.push({
      vehicleNo,
      issue,
      time,
      status,
      remarks
    });
  });

  // Convert to array format
  Object.values(zoneBreakdowns).forEach(zoneData => {
    if (zoneData.Count > 0) {
      longData.push(zoneData);
    }
  });

  return longData;
};

// Transform issue data to preserve detailed issue breakdown
const transformIssueData = (data) => {
  const longData = [];

  data.forEach(row => {
    const date = normalizeDate(row.Date);
    let zone = row.Zone;

    // Extract zone number from zone names like "Zone 1 - Kila Maidan" or "Zone -1"
    if (zone) {
      const zoneMatch = zone.match(/Zone\s*(-?\d+)/);
      if (zoneMatch) {
        zone = zoneMatch[1];
      }
    }

    // Extract issue counts
    const driverIssue = parseInt(row['Driver Issue']) || 0;
    const helperIssue = parseInt(row['Helper Issue']) || 0;
    const breakdownIssue = parseInt(row['Breakdown Issue']) || 0;
    const workshopIssue = parseInt(row['Workshop Issue']) || 0;
    const otherIssue = parseInt(row['Other Issue']) || 0;

    const totalCount = driverIssue + helperIssue + breakdownIssue + workshopIssue + otherIssue;

    if (totalCount > 0) {
      longData.push({
        Date: date,
        Zone: zone,
        Count: totalCount,
        DriverIssue: driverIssue,
        HelperIssue: helperIssue,
        BreakdownIssue: breakdownIssue,
        WorkshopIssue: workshopIssue,
        OtherIssue: otherIssue,
        IssueBreakdown: {
          'Driver Issue': driverIssue,
          'Helper Issue': helperIssue,
          'Breakdown Issue': breakdownIssue,
          'Workshop Issue': workshopIssue,
          'Other Issue': otherIssue
        }
      });
    }
  });

  return longData;
};

// Transform lessThan3Trips data to preserve individual trip count data
const transformLessThan3TripsData = (data) => {
  const longData = [];

  data.forEach(row => {
    const date = row.Date;
    let zone = row.Zone;

    // Extract zone number from zone names like "Zone 1 - Kila Maidan" or "Zone -1"
    if (zone) {
      const zoneMatch = zone.match(/Zone\s*(-?\d+)/);
      if (zoneMatch) {
        zone = zoneMatch[1];
      }
    }

    // Extract individual trip counts
    const tripCount0 = parseInt(row['0 Trip Count Vehicles']) || 0;
    const tripCount1 = parseInt(row['1 Trip Count Vehicles']) || 0;
    const tripCount2 = parseInt(row['2 Trip Count Vehicles']) || 0;
    const totalCount = tripCount0 + tripCount1 + tripCount2;

    // Only add rows that have vehicles with less than 3 trips
    if (totalCount > 0) {
      longData.push({
        Date: date,
        Zone: zone,
        Count: totalCount,
        TripCount0: tripCount0,
        TripCount1: tripCount1,
        TripCount2: tripCount2
      });
    }
  });

  return longData;
};

// Transform percentage data to standardized format
const transformPercentageData = (data) => {
  const longData = [];

  data.forEach(row => {
    const date = row.Date;
    let zone = row.Zone;

    // Extract zone number from zone names like "Zone 1 - Kila Maidan" or "Zone -1"
    if (zone) {
      const zoneMatch = zone.match(/Zone\s*(-?\d+)/);
      if (zoneMatch) {
        zone = zoneMatch[1];
      }
    }

    // Handle percentage data - prioritize Software % over Actual %
    let percentage = 0;
    let remarks = row.Remarks || '';

    if (row['Software %']) {
      // Remove % symbol and convert to number
      percentage = parseFloat(row['Software %'].replace('%', '')) || 0;
    } else if (row['Actual %']) {
      percentage = parseFloat(row['Actual %'].replace('%', '')) || 0;
    }

    if (percentage > 0) {
      longData.push({
        Date: date,
        Zone: zone,
        Count: percentage, // Using Count field to store percentage for consistency
        Percentage: percentage,
        SoftwarePercentage: row['Software %'] ? parseFloat(row['Software %'].replace('%', '')) : null,
        ActualPercentage: row['Actual %'] ? parseFloat(row['Actual %'].replace('%', '')) : null,
        Remarks: remarks
      });
    }
  });

  return longData;
};

// Transform vehicle numbers data to standardized format
const transformVehicleNumbersData = (data) => {
  const longData = [];

  data.forEach(row => {
    const date = normalizeDate(row.Date);
    let zone = row.Zone;
    const vehicleNumbers = row['Vehicle Numbers'] || '';
    const totalVehicles = parseInt(row['Total Vehicles']) || 1;

    // Skip empty rows
    if (!date || !zone) return;

    // Ensure zone is a string for consistency
    zone = String(zone);

    longData.push({
      Date: date,
      Zone: zone,
      Count: totalVehicles,
      VehicleNumbers: vehicleNumbers,
      TotalVehicles: totalVehicles
    });
  });

  return longData;
};
// Transform sphere workshop exit data - keep raw data as is
const transformSphereWorkshopExitData = (data) => {
  return data.map(row => ({
    Date: normalizeDate(row.Date),
    Zone: row.Zone,
    Ward: row.Ward || '',
    'Permanent Vehicle Number': row['Permanent Vehicle Number'] || '',
    'Spare Vehicle Number': row['Spare Vehicle Number'] || '',
    'Workshop Departure Time': row['Workshop Departure Time'] || ''
  })).filter(row => row.Date && row.Zone); // Only filter out completely empty rows
};





// Enhanced fetch function for all sheets
export const fetchSheetData = async (sheetName) => {
  try {
    const gid = SHEET_GIDS[sheetName];
    if (!gid) {
      throw new Error(`Unknown sheet: ${sheetName}`);
    }

    const url = getSheetCSVUrl(gid);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();



    let parsedData = parseCSV(csvText);

    // Check data format and transform accordingly
    if (parsedData.length > 0) {
      const headers = Object.keys(parsedData[0]);
      const hasZoneColumns = headers.some(header => header.startsWith('Zone '));
      const hasZoneField = headers.includes('Zone');
      const hasPercentageColumns = headers.some(header => header.includes('%'));
      const hasIssueColumns = headers.some(header =>
        header.includes('Driver Issue') ||
        header.includes('Helper Issue') ||
        header.includes('Breakdown Issue') ||
        header.includes('Workshop Issue')
      );
      const hasVehicleBreakdownColumns = headers.includes('Issue') && headers.includes('Vehicle No.');
      const hasMultipleCountColumns = headers.filter(h => h !== 'Date' && h !== 'Zone' && !isNaN(parseInt(parsedData[0][h] || 0))).length > 1;

      if (hasZoneColumns) {
        // Wide format with Zone columns (e.g., Zone 1, Zone 2, etc.)
        parsedData = transformWideToLong(parsedData);
      } else if (sheetName === 'glitchPercentage' && hasPercentageColumns) {
        // Special handling for glitch percentage data
        parsedData = transformPercentageData(parsedData);
      } else if (sheetName === 'lessThan3Trips') {
        // Special handling for lessThan3Trips data to preserve individual trip counts
        parsedData = transformLessThan3TripsData(parsedData);
      } else if (sheetName === 'vehicleBreakdown' && hasVehicleBreakdownColumns) {
        // Special handling for vehicle breakdown data with detailed breakdown information
        parsedData = transformVehicleBreakdownData(parsedData);
      } else if (sheetName === 'fuelStation') {
        // Special handling for fuel station data with timing information
        parsedData = transformFuelStationData(parsedData);
      } else if (sheetName === 'issuesPost0710' || sheetName === 'post06AMOpenIssues') {
        // Special handling for late vehicle data (after 6pm, after 7pm)
        // Try detailed transformation first, fallback to basic if no detailed data
        const detailedData = transformLateVehicleData(parsedData);
        if (detailedData.length === 0 && parsedData.length > 0) {
          // Fallback to basic transformation if no detailed data found
          parsedData = parsedData.map(row => ({
            ...row,
            Date: normalizeDate(row.Date),
            Count: row.Count || 1 // Default count of 1 if not specified
          })).filter(row => row.Date && row.Zone);
        } else {
          parsedData = detailedData;
        }
      } else if (hasIssueColumns && ['issuesPost0710', 'post06AMOpenIssues'].includes(sheetName)) {
        // Special handling for issue data to preserve breakdown information
        parsedData = transformIssueData(parsedData);
      } else if (hasZoneField && hasMultipleCountColumns) {
        // Format with Zone field and multiple count columns
        parsedData = transformMultiColumnData(parsedData);
      } else if (sheetName === 'vehicleNumbers') {
        // Special handling for vehicle numbers data
        parsedData = transformVehicleNumbersData(parsedData);
      } else if (sheetName === 'sphereWorkshopExit') {
        // Special handling for sphere workshop exit data
        parsedData = transformSphereWorkshopExitData(parsedData);
      } else if (sheetName === 'onRouteVehicles') {
        // Standardize the onRouteVehicles sheet to use 'Count' instead of 'On Route Vehicle Count'
        parsedData = parsedData.map(row => ({
          ...row,
          Date: normalizeDate(row.Date),
          Count: row['On Route Vehicle Count'] || row['Count'] || 0
        })).filter(row => row.Date && row.Zone); // Filter out empty rows

      } else {
        // Default transformation for other sheets
        parsedData = parsedData.map(row => ({
          ...row,
          Date: normalizeDate(row.Date),
          Count: row.Count || 1
        })).filter(row => row.Date && row.Zone);
      }
    }



    return parsedData;
  } catch (error) {
    console.error(`Error fetching data for ${sheetName}:`, error);
    return [];
  }
};

// Fetch all sheets data
export const fetchAllSheetsData = async () => {
  const promises = Object.keys(SHEET_GIDS).map(async (sheetName) => {
    const data = await fetchSheetData(sheetName);
    return { sheetName, data };
  });

  const results = await Promise.all(promises);
  const allData = {};

  results.forEach(({ sheetName, data }) => {
    allData[sheetName] = data;
  });

  return allData;
};

// Get unique zones from data (excluding negative zones)
export const getUniqueZones = (data) => {
  const zones = new Set();
  Object.values(data).forEach(sheetData => {
    sheetData.forEach(row => {
      if (row.Zone) {
        const zoneNumber = Number(row.Zone);
        // Only include zones with positive numbers
        if (!isNaN(zoneNumber) && zoneNumber > 0) {
          zones.add(row.Zone);
        }
      }
    });
  });
  return Array.from(zones).sort((a, b) => Number(a) - Number(b));
};

// Normalize date format
const normalizeDate = (dateStr) => {
  if (!dateStr) return '';

  // Handle different date formats
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return dateStr; // Return original if can't parse
  }

  // Return in YYYY-MM-DD format
  return date.toISOString().split('T')[0];
};

// Get unique dates from data
export const getUniqueDates = (data) => {
  const dates = new Set();
  Object.values(data).forEach(sheetData => {
    sheetData.forEach(row => {
      if (row.Date) {
        const normalizedDate = normalizeDate(row.Date);
        if (normalizedDate) {
          dates.add(normalizedDate);
        }
      }
    });
  });
  return Array.from(dates).sort();
};
