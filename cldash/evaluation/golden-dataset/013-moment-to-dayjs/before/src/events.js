// Event management using moment.js
import moment from 'moment';

/**
 * Create a new event with normalized dates
 */
export function createEvent(title, startDate, endDate) {
  return {
    id: generateId(),
    title,
    startDate: moment(startDate).toISOString(),
    endDate: moment(endDate).toISOString(),
    createdAt: moment().toISOString()
  };
}

/**
 * Filter events by date range
 */
export function filterEventsByDateRange(events, startDate, endDate) {
  const start = moment(startDate);
  const end = moment(endDate);

  return events.filter(event => {
    const eventStart = moment(event.startDate);
    return eventStart.isSameOrAfter(start) && eventStart.isSameOrBefore(end);
  });
}

/**
 * Group events by month
 */
export function groupEventsByMonth(events) {
  const grouped = {};

  events.forEach(event => {
    const monthKey = moment(event.startDate).format('YYYY-MM');
    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(event);
  });

  return grouped;
}

/**
 * Get next occurrence of recurring event
 */
export function getNextOccurrence(event, recurrenceUnit, recurrenceAmount) {
  const lastOccurrence = moment(event.startDate);
  return lastOccurrence.add(recurrenceAmount, recurrenceUnit).toDate();
}

/**
 * Simple ID generator
 */
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}
