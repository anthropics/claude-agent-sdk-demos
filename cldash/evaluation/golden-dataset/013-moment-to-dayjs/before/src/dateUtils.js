// Date utilities using moment.js - common patterns found in production
import moment from 'moment';

/**
 * Format event date for display
 */
export function formatEventDate(date, format = 'MMMM DD, YYYY') {
  return moment(date).format(format);
}

/**
 * Check if event is upcoming (within next 7 days)
 */
export function isEventUpcoming(date) {
  const eventDate = moment(date);
  const now = moment();
  const weekFromNow = moment().add(7, 'days');

  return eventDate.isAfter(now) && eventDate.isBefore(weekFromNow);
}

/**
 * Get duration between two dates in hours
 */
export function getEventDuration(startDate, endDate) {
  const start = moment(startDate);
  const end = moment(endDate);

  return end.diff(start, 'hours');
}

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date) {
  return moment(date).fromNow();
}

/**
 * Parse date from various formats
 */
export function parseDate(dateString) {
  return moment(dateString).toDate();
}

/**
 * Check if date is valid
 */
export function isValidDate(date) {
  return moment(date).isValid();
}

/**
 * Get start of day
 */
export function getStartOfDay(date) {
  return moment(date).startOf('day').toDate();
}

/**
 * Get end of month
 */
export function getEndOfMonth(date) {
  return moment(date).endOf('month').toDate();
}

/**
 * Add time to date
 */
export function addTime(date, amount, unit) {
  return moment(date).add(amount, unit).toDate();
}

/**
 * Check if date is between two other dates
 */
export function isBetween(date, start, end) {
  return moment(date).isBetween(start, end);
}
