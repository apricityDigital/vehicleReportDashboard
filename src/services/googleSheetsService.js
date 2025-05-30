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
  post06AMOpenIssues: '291765477',
  vehicleBreakdown: '213524255'
};

// Convert Google Sheets to CSV URL
const getSheetCSVUrl = (gid) => {
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
};

// Parse CSV data with proper handling of quoted fields
const parseCSV = (csvText) => {
  const lines = csvText.split('\n');
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
    const date = row.Date;
    Object.keys(row).forEach(key => {
      if (key !== 'Date' && key.startsWith('Zone ')) {
        const zone = key.replace('Zone ', '');
        const value = row[key];
        if (value && value !== '0') {
          longData.push({
            Date: date,
            Zone: zone,
            Count: value
          });
        }
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

// Fetch data from a specific sheet
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
      } else if (hasZoneField && hasMultipleCountColumns) {
        // Format with Zone field and multiple count columns
        parsedData = transformMultiColumnData(parsedData);
      } else if (sheetName === 'onRouteVehicles') {
        // Standardize the onRouteVehicles sheet to use 'Count' instead of 'On Route Vehicle Count'
        parsedData = parsedData.map(row => ({
          ...row,
          Count: row['On Route Vehicle Count']
        }));
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

// Get unique zones from data
export const getUniqueZones = (data) => {
  const zones = new Set();
  Object.values(data).forEach(sheetData => {
    sheetData.forEach(row => {
      if (row.Zone) {
        zones.add(row.Zone);
      }
    });
  });
  return Array.from(zones).sort((a, b) => Number(a) - Number(b));
};

// Get unique dates from data
export const getUniqueDates = (data) => {
  const dates = new Set();
  Object.values(data).forEach(sheetData => {
    sheetData.forEach(row => {
      if (row.Date) {
        dates.add(row.Date);
      }
    });
  });
  return Array.from(dates).sort();
};
