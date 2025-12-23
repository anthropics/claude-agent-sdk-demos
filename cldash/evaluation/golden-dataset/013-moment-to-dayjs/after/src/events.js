// Event management using moment.js
import dayjs from 'dayjs';
import isSameOrAfterPlugin from 'dayjs/plugin/isSameOrAfter.js';
import isSameOrBeforePlugin from 'dayjs/plugin/isSameOrBefore.js';
dayjs.extend(isSameOrAfterPlugin);
dayjs.extend(isSameOrBeforePlugin);



/**
 * Create a new event with normalized dates
 */
export function createEvent(title, startDate, endDate) {
  return {
    id: generateId(),
    title,
    startDate: dayjs(startDate).toISOString(),
    endDate: dayjs(endDate).toISOString(),
    createdAt: dayjs().toISOString()
  };
}

/**
 * Filter events by date range
 */
export function filterEventsByDateRange(events, startDate, endDate) {
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  return events.filter(event => {
    const eventStart = dayjs(event.startDate);
    return eventStart.isSameOrAfter(start) && eventStart.isSameOrBefore(end);
  });
}

/**
 * Group events by month
 */
export function groupEventsByMonth(events) {
  const grouped = {};

  events.forEach(event => {
    const monthKey = dayjs(event.startDate).format('YYYY-MM');
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
  const lastOccurrence = dayjs(event.startDate);
  return lastOccurrence.add(recurrenceAmount, recurrenceUnit).toDate();
}

/**
 * Simple ID generator
 */
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}
