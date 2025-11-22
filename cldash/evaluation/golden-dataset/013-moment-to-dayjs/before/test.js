// Test suite for event scheduler
import assert from 'assert';
import {
  formatEventDate,
  isEventUpcoming,
  getEventDuration,
  getRelativeTime,
  parseDate,
  isValidDate,
  getStartOfDay,
  addTime,
  isBetween
} from './src/dateUtils.js';
import { createEvent, filterEventsByDateRange, groupEventsByMonth } from './src/events.js';
import { generateReport, calculateStats } from './src/reports.js';

console.log('Running tests...\n');

// Test formatEventDate
const testDate = new Date('2025-01-15T10:00:00Z');
const formatted = formatEventDate(testDate);
assert(formatted.includes('January'), 'formatEventDate should format date');
console.log('✓ formatEventDate tests passed');

// Test getEventDuration
const start = new Date('2025-01-15T10:00:00Z');
const end = new Date('2025-01-15T14:00:00Z');
const duration = getEventDuration(start, end);
assert.strictEqual(duration, 4, 'getEventDuration should calculate hours');
console.log('✓ getEventDuration tests passed');

// Test parseDate
const parsed = parseDate('2025-01-15');
assert(parsed instanceof Date, 'parseDate should return Date object');
console.log('✓ parseDate tests passed');

// Test isValidDate
assert(isValidDate('2025-01-15') === true, 'isValidDate should validate correct date');
assert(isValidDate('invalid') === false, 'isValidDate should reject invalid date');
console.log('✓ isValidDate tests passed');

// Test getStartOfDay
const startOfDay = getStartOfDay('2025-01-15T14:30:00');
const dateStr = startOfDay.toISOString();
assert(dateStr.includes('T00:00:00') || startOfDay.getHours() === 0, 'getStartOfDay should set to start of day');
console.log('✓ getStartOfDay tests passed');

// Test addTime
const future = addTime('2025-01-15', 7, 'days');
assert(future instanceof Date, 'addTime should return Date');
console.log('✓ addTime tests passed');

// Test isBetween
const testDateBetween = new Date('2025-01-15');
const rangeStart = new Date('2025-01-01');
const rangeEnd = new Date('2025-01-31');
assert(isBetween(testDateBetween, rangeStart, rangeEnd) === true, 'isBetween should work');
console.log('✓ isBetween tests passed');

// Test createEvent
const event = createEvent('Team Meeting', '2025-01-15T10:00:00Z', '2025-01-15T11:00:00Z');
assert(event.title === 'Team Meeting', 'createEvent should set title');
assert(event.startDate, 'createEvent should set startDate');
assert(event.id, 'createEvent should generate id');
console.log('✓ createEvent tests passed');

// Test filterEventsByDateRange
const events = [
  createEvent('Event 1', '2025-01-10', '2025-01-10'),
  createEvent('Event 2', '2025-01-15', '2025-01-15'),
  createEvent('Event 3', '2025-01-20', '2025-01-20'),
];
const filtered = filterEventsByDateRange(events, '2025-01-12', '2025-01-18');
assert.strictEqual(filtered.length, 1, 'filterEventsByDateRange should filter correctly');
console.log('✓ filterEventsByDateRange tests passed');

// Test groupEventsByMonth
const grouped = groupEventsByMonth(events);
assert(Object.keys(grouped).length > 0, 'groupEventsByMonth should group events');
console.log('✓ groupEventsByMonth tests passed');

// Test generateReport
const report = generateReport(events, '2025-01-01');
assert(report.totalEvents >= 0, 'generateReport should count events');
assert(report.month.includes('January'), 'generateReport should format month');
console.log('✓ generateReport tests passed');

// Test calculateStats
const stats = calculateStats(events, '2025-01-01', '2025-01-31');
assert.strictEqual(stats.totalEvents, 3, 'calculateStats should count all events');
assert.strictEqual(stats.totalDays, 31, 'calculateStats should calculate days');
console.log('✓ calculateStats tests passed');

console.log('\n✅ All tests passed!');
