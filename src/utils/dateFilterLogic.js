/**
 * Date Filter Logic Utilities
 * 
 * Contains all the business logic for date-based filtering.
 * Implements OR logic where data matches either specific date OR date range.
 * 
 * Key Features:
 * - OR logic between specific date and date range filters
 * - Robust date normalization and validation
 * - Support for partial date ranges (only start or only end date)
 * - Consistent behavior across all chart types
 */

import { format } from 'date-fns';

/**
 * Normalizes date format to handle different date formats consistently
 * @param {string} dateStr - Date string in various formats
 * @returns {string} Normalized date string in YYYY-MM-DD format or empty string if invalid
 */
const normalizeDate = (dateStr) => {
  if (!dateStr) return '';

  try {
    // Handle different date formats
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr; // Return original if can't parse
    }

    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.warn('Date normalization error:', error);
    return dateStr; // Return original on error
  }
};

/**
 * Checks if a date matches the specific date filter
 * @param {string} rowDate - Normalized date from data row
 * @param {string} selectedDate - Selected specific date filter
 * @returns {boolean} True if dates match
 */
const matchesSpecificDate = (rowDate, selectedDate) => {
  if (!selectedDate) return false;
  
  const filterDate = normalizeDate(selectedDate);
  return rowDate === filterDate;
};

/**
 * Checks if a date falls within the date range filter
 * @param {string} rowDate - Normalized date from data row
 * @param {string} startDate - Start date of range filter
 * @param {string} endDate - End date of range filter
 * @returns {boolean} True if date falls within range
 */
const matchesDateRange = (rowDate, startDate, endDate) => {
  // If no range dates are provided, no match
  if (!startDate && !endDate) return false;
  
  let rangeMatch = false;
  
  if (startDate && endDate) {
    // Both start and end dates provided - check if date is within range
    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);
    rangeMatch = rowDate >= start && rowDate <= end;
  } else if (startDate) {
    // Only start date provided - check if date is on or after start
    const start = normalizeDate(startDate);
    rangeMatch = rowDate >= start;
  } else if (endDate) {
    // Only end date provided - check if date is on or before end
    const end = normalizeDate(endDate);
    rangeMatch = rowDate <= end;
  }
  
  return rangeMatch;
};

/**
 * Applies date filtering logic with OR condition between specific date and date range
 * 
 * Filter Logic:
 * 1. If no date filters are applied, show all data
 * 2. If only specific date is set, show data matching that date
 * 3. If only date range is set, show data within that range
 * 4. If both are set, show data that matches EITHER condition (OR logic)
 * 
 * @param {string} rowDate - Date from the data row
 * @param {string} selectedDate - Specific date filter value
 * @param {string} startDate - Start date of range filter
 * @param {string} endDate - End date of range filter
 * @returns {boolean} True if the row should be included based on date filters
 */
export const applyDateFiltering = (rowDate, selectedDate, startDate, endDate) => {
  const normalizedRowDate = normalizeDate(rowDate);
  
  // If no date filters are applied, show all data
  if (!selectedDate && !startDate && !endDate) {
    return true;
  }
  
  // Check specific date match
  const specificDateMatch = matchesSpecificDate(normalizedRowDate, selectedDate);
  
  // Check date range match
  const dateRangeMatch = matchesDateRange(normalizedRowDate, startDate, endDate);
  
  // Return true if EITHER condition matches (OR logic)
  return specificDateMatch || dateRangeMatch;
};

/**
 * Applies zone filtering logic
 * @param {string} rowZone - Zone from the data row
 * @param {string} selectedZone - Selected zone filter value
 * @returns {boolean} True if the row should be included based on zone filter
 */
export const applyZoneFiltering = (rowZone, selectedZone) => {
  // If no zone filter is applied, show all data
  if (!selectedZone) return true;
  
  // Convert both to strings for consistent comparison
  return String(rowZone) === String(selectedZone);
};

/**
 * Applies trip count filtering logic for lessThan3Trips data
 * @param {Object} row - Data row object
 * @param {string} tripCountFilter - Trip count filter value ('all', '0', '1', '2')
 * @returns {boolean} True if the row should be included based on trip count filter
 */
export const applyTripCountFiltering = (row, tripCountFilter) => {
  // If no trip count filter or set to 'all', include all rows
  if (!tripCountFilter || tripCountFilter === 'all') {
    return true;
  }
  
  // Check if row has trip count data
  const hasTripCountData = (
    row.TripCount0 !== undefined || 
    row.TripCount1 !== undefined || 
    row.TripCount2 !== undefined
  );
  
  if (!hasTripCountData) {
    return true; // Include rows without trip count data
  }
  
  // Apply specific trip count filter
  switch (tripCountFilter) {
    case '0':
      return (row.TripCount0 || 0) > 0;
    case '1':
      return (row.TripCount1 || 0) > 0;
    case '2':
      return (row.TripCount2 || 0) > 0;
    default:
      // For any other value, show all vehicles with <3 trips
      return ((row.TripCount0 || 0) + (row.TripCount1 || 0) + (row.TripCount2 || 0)) >= 0;
  }
};

/**
 * Main filtering function that combines all filter types
 *
 * This is the primary function used by components to filter data.
 * It applies date, zone, and trip count filters with proper logic.
 *
 * @param {Object} row - Data row to filter
 * @param {Object} filters - Filter values object
 * @param {string} filters.selectedDate - Specific date filter
 * @param {string} filters.startDate - Range start date filter
 * @param {string} filters.endDate - Range end date filter
 * @param {string} filters.selectedZone - Zone filter
 * @param {string} filters.tripCountFilter - Trip count filter
 * @returns {boolean} True if the row should be included in filtered results
 */
export const shouldIncludeRow = (row, filters) => {
  const {
    selectedDate,
    startDate,
    endDate,
    selectedZone,
    tripCountFilter
  } = filters;

  // Apply date filtering (OR logic between specific date and range)
  const dateMatch = applyDateFiltering(row.Date, selectedDate, startDate, endDate);

  // Apply zone filtering
  const zoneMatch = applyZoneFiltering(row.Zone, selectedZone);

  // Apply trip count filtering (only for relevant sheets)
  let tripCountMatch = true;
  if (tripCountFilter && tripCountFilter !== 'all') {
    tripCountMatch = applyTripCountFiltering(row, tripCountFilter);
  }

  // All filters must match (AND logic between different filter types)
  return dateMatch && zoneMatch && tripCountMatch;
};

// Export the normalize date function for use in other modules
export { normalizeDate };
