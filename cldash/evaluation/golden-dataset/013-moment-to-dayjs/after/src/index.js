// Main entry point - demonstrates various moment.js patterns
import { formatEventDate, isEventUpcoming, getEventDuration, getRelativeTime } from './dateUtils.js';
import { createEvent, filterEventsByDateRange } from './events.js';
import { generateReport } from './reports.js';

export {
  formatEventDate,
  isEventUpcoming,
  getEventDuration,
  getRelativeTime,
  createEvent,
  filterEventsByDateRange,
  generateReport
};
