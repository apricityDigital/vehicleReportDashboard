// Google Sheets service for fetching data
import { format } from 'date-fns';

const SPREADSHEET_ID = '1DsDk17Vyf2zj5kxr86JPVhYZ04ZstY0IAH7La4UeVa0';

// Sheet GIDs for different reports
const SHEET_GIDS = {
  onRouteVehicles: '0',
  onBoardAfter3PM: '1335240771',
  lessThan3Trips: '1474814226',
  glitchPercentage: '1163492617',
  issuesPost0710: '203626227',
  fuelStation: '431461673',
  post06AMOpenIssues: '291765477', // Open Tipper data - issues after 6AM
  vehicleBreakdown: '213524255',
  vehicleNumbers: '510665731',
  sphereWorkshopExit: '1903869379' // Workshop departure data - sphere vehicles leaving workshops late
};

// Convert Google Sheets to CSV URL
const getSheetCSVUrl = (gid) => {
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
};

// Enhanced CSV parser with better handling of malformed Google Sheets data
const parseCSV = (csvText) => {
  // Handle different line break formats and fix malformed CSV
  let normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Special handling for Google Sheets CSV that comes as one line with space-separated rows
  if (!normalizedText.includes('\n') && normalizedText.includes('2025-')) {
    console.log('⚠️  Detected single-line CSV format - applying fix');
    console.log('📋 Raw CSV text:', normalizedText);

    // For the specific format: "Date,Zone,Driver Issue,Helper Issue,Breakdown Issue,Workshop Issue 2025-05-12,Zone -1,0,0,0,1 2025-05-12,Zone -2,0,0,0,0..."
    // Split by date pattern and reconstruct properly

    // First, extract the header (everything before the first date)
    const firstDateMatch = normalizedText.match(/(\d{4}-\d{2}-\d{2})/);
    if (firstDateMatch) {
      const firstDateIndex = normalizedText.indexOf(firstDateMatch[0]);
      const headerPart = normalizedText.substring(0, firstDateIndex).trim();
      const dataPart = normalizedText.substring(firstDateIndex).trim();

      console.log('📋 Extracted header:', headerPart);
      console.log('📊 Data part preview:', dataPart.substring(0, 100) + '...');

      // Split data by date pattern, keeping the dates
      const dataRows = dataPart.split(/(?=\d{4}-\d{2}-\d{2})/).filter(row => row.trim());

      console.log('📊 Found data rows:', dataRows.length);
      console.log('📊 Sample data row:', dataRows[0]);

      // Clean up each data row by replacing spaces between values with commas where appropriate
      const cleanedDataRows = dataRows.map(row => {
        // Replace spaces with commas, but be careful with zone names that might have spaces
        // Pattern: date,zone,numbers... where numbers are separated by spaces
        const trimmedRow = row.trim();

        // Find the pattern: YYYY-MM-DD,Zone -X,numbers
        const match = trimmedRow.match(/^(\d{4}-\d{2}-\d{2}),(.+?),(.+)$/);
        if (match) {
          const date = match[1];
          const zone = match[2];
          const numbers = match[3].replace(/\s+/g, ','); // Replace spaces with commas for numbers
          return `${date},${zone},${numbers}`;
        }

        return trimmedRow;
      });

      // Reconstruct with proper line breaks
      normalizedText = headerPart + '\n' + cleanedDataRows.join('\n');

      console.log('✅ Fixed CSV format - new line count:', normalizedText.split('\n').length);
      console.log('✅ Sample fixed row:', normalizedText.split('\n')[1]);
    }
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
  console.log("Parsed Data:", data);  // Log the parsed data

  return data;
};

// Transform wide format data to long format
const transformWideToLong = (data) => {
  const longData = [];
  console.log("Transforming wide format data to long format...");
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

  console.log("Starting vehicle breakdown transformation...");

  data.forEach(row => {
    // Log each row for debugging
    console.log('Row data:', row);

    const date = normalizeDate(row.Date);
    let zone = row.Zone;
    const issue = row.Issue || '';
    const vehicleNo = row['Vehicle No.'] || '';
    const breakdownTime = row['Breakdown Time'] || '';
    const spareStatus = row['Spare/OK'] || '';
    const spareTime = row['Spare/OK Time'] || '';

    // Skip empty rows or rows with missing critical data
    if (!date || !zone || !issue) {
      console.log('Skipping row due to missing data:', row);
      return;
    }

    // Log to ensure that the zone and issue data are valid
    console.log('Processing breakdown for Zone:', zone, 'Issue:', issue, 'Date:', date);

    // Ensure zone is a string for consistency
    zone = String(zone);

    // Create a unique key for zone-date combination to handle multiple dates per zone
    const zoneeDateKey = `${zone}_${date}`;

    // Initialize zone breakdown if not exists
    if (!zoneBreakdowns[zoneeDateKey]) {
      zoneBreakdowns[zoneeDateKey] = {
        Date: date,
        Zone: zone,
        Count: 0,
        IssueBreakdown: {},
        Details: []
      };
    }

    // Increment count for this zone-date combination
    zoneBreakdowns[zoneeDateKey].Count += 1;

    // Track issue types in the breakdown
    if (!zoneBreakdowns[zoneeDateKey].IssueBreakdown[issue]) {
      zoneBreakdowns[zoneeDateKey].IssueBreakdown[issue] = 0;
    }
    zoneBreakdowns[zoneeDateKey].IssueBreakdown[issue] += 1;

    // Store detailed breakdown information
    zoneBreakdowns[zoneeDateKey].Details.push({
      vehicleNo,
      issue,
      breakdownTime,
      spareStatus,
      spareTime,
      date // Include date in details for reference
    });
  });

  // Convert the object values (zone breakdowns) into an array
  Object.values(zoneBreakdowns).forEach(zoneData => {
    if (zoneData.Count > 0) {
      longData.push(zoneData);
    }
  });

  // Log final data to check if transformation is correct
  console.log("Transformed vehicle breakdown data:", longData);
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
  console.log("Transforming late vehicle data...");
  console.log("Sample row before transformation:", data[0]);
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
  console.log("Transforming issue data...");
  console.log("Sample row before transformation:", data[0]);

  const longData = [];
  const zoneBreakdowns = {};

  data.forEach(row => {
    const date = normalizeDate(row.Date);
    let zone = row.Zone;

    // Skip empty rows
    if (!date || !zone) {
      console.log('Skipping row due to missing date or zone:', row);
      return;
    }

    // Extract zone number from zone names like "Zone -1", "ZONE -2", etc.
    // Convert negative zones to positive for display (Zone -1 becomes Zone 1)
    if (zone) {
      const zoneMatch = zone.match(/ZONE\s*(-?\d+)|Zone\s*(-?\d+)/i);
      if (zoneMatch) {
        const zoneNumber = zoneMatch[1] || zoneMatch[2];
        zone = Math.abs(parseInt(zoneNumber)).toString(); // Convert to positive number
      }
    }

    console.log('Processing issue data for Zone:', zone, 'Date:', date);

    // Extract issue counts
    const driverIssue = parseInt(row['Driver Issue']) || 0;
    const helperIssue = parseInt(row['Helper Issue']) || 0;
    const breakdownIssue = parseInt(row['Breakdown Issue']) || 0;
    const workshopIssue = parseInt(row['Workshop Issue']) || 0;
    const otherIssue = parseInt(row['Other Issue']) || 0;

    const totalCount = driverIssue + helperIssue + breakdownIssue + workshopIssue + otherIssue;

    console.log('Issue counts for zone', zone, ':', {
      driverIssue, helperIssue, breakdownIssue, workshopIssue, otherIssue, totalCount
    });

    // Create a unique key for zone-date combination
    const zoneDateKey = `${zone}_${date}`;

    // Initialize zone breakdown if not exists
    if (!zoneBreakdowns[zoneDateKey]) {
      zoneBreakdowns[zoneDateKey] = {
        Date: date,
        Zone: zone,
        Count: 0,
        DriverIssue: 0,
        HelperIssue: 0,
        BreakdownIssue: 0,
        WorkshopIssue: 0,
        OtherIssue: 0,
        IssueBreakdown: {},
        Details: []
      };
    }

    // Add to totals
    zoneBreakdowns[zoneDateKey].Count += totalCount;
    zoneBreakdowns[zoneDateKey].DriverIssue += driverIssue;
    zoneBreakdowns[zoneDateKey].HelperIssue += helperIssue;
    zoneBreakdowns[zoneDateKey].BreakdownIssue += breakdownIssue;
    zoneBreakdowns[zoneDateKey].WorkshopIssue += workshopIssue;
    zoneBreakdowns[zoneDateKey].OtherIssue += otherIssue;

    // Update issue breakdown
    zoneBreakdowns[zoneDateKey].IssueBreakdown = {
      'Driver Issue': zoneBreakdowns[zoneDateKey].DriverIssue,
      'Helper Issue': zoneBreakdowns[zoneDateKey].HelperIssue,
      'Breakdown Issue': zoneBreakdowns[zoneDateKey].BreakdownIssue,
      'Workshop Issue': zoneBreakdowns[zoneDateKey].WorkshopIssue,
      'Other Issue': zoneBreakdowns[zoneDateKey].OtherIssue
    };

    // Store detailed information for each issue type
    // Determine the context based on the sheet name (if available in scope)
    const isPost06AM = true; // This function is used for both sheets, but we can determine context
    const timeContext = isPost06AM ? 'After 6:00 AM' : 'After 7:10 AM';
    const actionContext = isPost06AM ? 'left zone parking' : 'arrived at first point';

    if (driverIssue > 0) {
      for (let i = 0; i < driverIssue; i++) {
        zoneBreakdowns[zoneDateKey].Details.push({
          vehicleNo: `Vehicle ${zoneBreakdowns[zoneDateKey].Details.length + 1}`,
          issue: 'Driver Issue',
          time: timeContext,
          status: 'Reported',
          remarks: `Open tipper ${actionContext} ${timeContext} due to driver issue`
        });
      }
    }
    if (helperIssue > 0) {
      for (let i = 0; i < helperIssue; i++) {
        zoneBreakdowns[zoneDateKey].Details.push({
          vehicleNo: `Vehicle ${zoneBreakdowns[zoneDateKey].Details.length + 1}`,
          issue: 'Helper Issue',
          time: timeContext,
          status: 'Reported',
          remarks: `Open tipper ${actionContext} ${timeContext} due to helper issue`
        });
      }
    }
    if (breakdownIssue > 0) {
      for (let i = 0; i < breakdownIssue; i++) {
        zoneBreakdowns[zoneDateKey].Details.push({
          vehicleNo: `Vehicle ${zoneBreakdowns[zoneDateKey].Details.length + 1}`,
          issue: 'Breakdown Issue',
          time: timeContext,
          status: 'Reported',
          remarks: `Open tipper ${actionContext} ${timeContext} due to breakdown`
        });
      }
    }
    if (workshopIssue > 0) {
      for (let i = 0; i < workshopIssue; i++) {
        zoneBreakdowns[zoneDateKey].Details.push({
          vehicleNo: `Vehicle ${zoneBreakdowns[zoneDateKey].Details.length + 1}`,
          issue: 'Workshop Issue',
          time: timeContext,
          status: 'Reported',
          remarks: `Open tipper ${actionContext} ${timeContext} due to workshop issue`
        });
      }
    }
    if (otherIssue > 0) {
      for (let i = 0; i < otherIssue; i++) {
        zoneBreakdowns[zoneDateKey].Details.push({
          vehicleNo: `Vehicle ${zoneBreakdowns[zoneDateKey].Details.length + 1}`,
          issue: 'Other Issue',
          time: timeContext,
          status: 'Reported',
          remarks: `Open tipper ${actionContext} ${timeContext} due to other issue`
        });
      }
    }
  });

  // Convert to array format
  Object.values(zoneBreakdowns).forEach(zoneData => {
    if (zoneData.Count > 0) {
      longData.push(zoneData);
    }
  });

  console.log("Transformed issue data:", longData);
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
    const rawDate = row.Date;
    const date = normalizeDate(rawDate);
    let zone = row.Zone;
    const vehicleNumbers = row['Vehicle Numbers'] || '';
    const totalVehicles = parseInt(row['Total Vehicles']) || 1;

    if (!date || !zone) return;

    zone = String(zone).trim();

    const vehicleList = vehicleNumbers
      .replace(/\s*OPEN\s*/gi, '')
      .split(/[\/,]/)
      .map(v => v.trim())
      .filter(v => v);

    const finalCount = vehicleList.length || totalVehicles;

    longData.push({
      Date: date,
      Zone: zone,
      Count: finalCount,  // ✅ actual count
      VehicleNumbers: vehicleList.join(', '),
      TotalVehicles: finalCount, // ✅ reflect the corrected count
    });
  });
  
  return longData;
};

// Transform workshop data to preserve all columns
const transformWorkshopData = (data) => {
  console.log('Transforming workshop data...');
  const transformedData = [];

  data.forEach(row => {
    const date = normalizeDate(row.Date);
    const zone = row.Zone;
    const ward = row.Ward;
    const permanentVehicleNumber = row['Permanent Vehicle Number'];
    const spareVehicleNumber = row['Spare Vehicle Number'];
    const workshopDepartureTime = row['Workshop Departure Time'];

    // Skip empty rows or rows without essential data
    if (!date || !zone || !workshopDepartureTime) return;

    // Preserve all workshop-specific data
    transformedData.push({
      Date: date,
      Zone: zone,
      Ward: ward,
      'Permanent Vehicle Number': permanentVehicleNumber,
      'Spare Vehicle Number': spareVehicleNumber,
      'Workshop Departure Time': workshopDepartureTime,
      Count: 1 // Each row represents one vehicle
    });
  });

  console.log('Transformed workshop data:', transformedData);
  return transformedData;
};

// Enhanced fetch function for all sheets
export const fetchSheetData = async (sheetName) => {
  try {
    const gid = SHEET_GIDS[sheetName];
    if (!gid) {
      throw new Error(`Unknown sheet: ${sheetName}`);
    }

    const url = getSheetCSVUrl(gid);
    console.log(`Fetching data for sheet: ${sheetName} from URL:`, url);

    const response = await fetch(url);
    console.log("Response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();
    console.log(`Raw CSV Data for sheet ${sheetName}:`, csvText); // Log raw CSV

    let parsedData = parseCSV(csvText);

    if (parsedData.length > 0) {
      const headers = Object.keys(parsedData[0]);
      const hasZoneColumns = headers.some(header => header.startsWith('Zone '));
      const hasZoneField = headers.includes('Zone');
      const hasIssueColumns = headers.some(header =>
        header.includes('Driver Issue') ||
        header.includes('Helper Issue') ||
        header.includes('Breakdown Issue') ||
        header.includes('Workshop Issue')
      );
      const hasVehicleBreakdownColumns = headers.includes('Issue') && headers.includes('Vehicle No.');

      // Log header details for debugging
      console.log('Parsed headers:', headers);
      
      try {
        if (sheetName === 'vehicleBreakdown' && hasVehicleBreakdownColumns) {
          // Special handling for vehicle breakdown data with detailed breakdown information
          parsedData = transformVehicleBreakdownData(parsedData);
        } else if (hasZoneColumns) {
          // Wide format with Zone columns (e.g., Zone 1, Zone 2, etc.)
          parsedData = transformWideToLong(parsedData);
        } else if (sheetName === 'glitchPercentage') {
          // Special handling for glitch percentage data
          parsedData = transformPercentageData(parsedData);
        } else if (sheetName === 'lessThan3Trips') {
          // Special handling for lessThan3Trips data to preserve individual trip counts
          parsedData = transformLessThan3TripsData(parsedData);
        } else if (sheetName === 'fuelStation') {
          // Special handling for fuel station data with timing information
          parsedData = transformFuelStationData(parsedData);
        } else if (sheetName === 'vehicleNumbers') {
          parsedData = transformVehicleNumbersData(parsedData);
        } else if (sheetName === 'sphereWorkshopExit') {
          // Special handling for workshop data to preserve all columns
          parsedData = transformWorkshopData(parsedData);
        } else if ((sheetName === 'issuesPost0710' || sheetName === 'post06AMOpenIssues') && hasIssueColumns) {
          // Special handling for both issue sheets with issue breakdown columns
          parsedData = transformIssueData(parsedData);
        } else if (hasZoneField) {
          // Format with Zone field and multiple count columns
          parsedData = transformMultiColumnData(parsedData);
        } else {
          // Default transformation for other sheets
          parsedData = parsedData.map(row => ({
            ...row,
            Date: normalizeDate(row.Date),
            Count: row.Count || 1
          })).filter(row => row.Date && row.Zone);
        }

        return parsedData;
      } catch (error) {
        console.error(`Error fetching data for ${sheetName}:`, error);
        return [];
      }
    } else {
      return [];
    }
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

  try {
    // Handle different date formats
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr; // Return original if can't parse
    }

    // Return in YYYY-MM-DD format using date-fns for consistency
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.warn('Date normalization error:', error);
    return dateStr; // Return original on error
  }
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
