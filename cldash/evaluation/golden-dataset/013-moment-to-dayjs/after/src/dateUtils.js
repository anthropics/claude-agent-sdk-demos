// Date utilities using moment.js - common patterns found in production
import dayjs from 'dayjs';
import isBetweenPlugin from 'dayjs/plugin/isBetween.js';
import relativeTimePlugin from 'dayjs/plugin/relativeTime.js';
dayjs.extend(isBetweenPlugin);
dayjs.extend(relativeTimePlugin);



/**
 * Format event date for display
 */
export function formatEventDate(date, format = 'MMMM DD, YYYY') {
  return dayjs(date).format(format);
}

/**
 * Check if event is upcoming (within next 7 days)
 */
export function isEventUpcoming(date) {
  const eventDate = dayjs(date);
  const now = dayjs();
  const weekFromNow = dayjs().add(7, 'days');

  return eventDate.isAfter(now) && eventDate.isBefore(weekFromNow);
}

/**
 * Get duration between two dates in hours
 */
export function getEventDuration(startDate, endDate) {
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  return end.diff(start, 'hours');
}

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date) {
  return dayjs(date).fromNow();
}

/**
 * Parse date from various formats
 */
export function parseDate(dateString) {
  return dayjs(dateString).toDate();
}

/**
 * Check if date is valid
 */
export function isValidDate(date) {
  return dayjs(date).isValid();
}

/**
 * Get start of day
 */
export function getStartOfDay(date) {
  return dayjs(date).startOf('day').toDate();
}

/**
 * Get end of month
 */
export function getEndOfMonth(date) {
  return dayjs(date).endOf('month').toDate();
}

/**
 * Add time to date
 */
export function addTime(date, amount, unit) {
  return dayjs(date).add(amount, unit).toDate();
}

/**
 * Check if date is between two other dates
 */
export function isBetween(date, start, end) {
  return dayjs(date).isBetween(start, end);
}
