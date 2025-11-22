// Report generation using moment.js
import dayjs from 'dayjs';
import isBetweenPlugin from 'dayjs/plugin/isBetween.js';
import relativeTimePlugin from 'dayjs/plugin/relativeTime.js';
dayjs.extend(isBetweenPlugin);
dayjs.extend(relativeTimePlugin);



/**
 * Generate monthly event report
 */
export function generateReport(events, month) {
  const targetMonth = dayjs(month);
  const monthStart = dayjs(targetMonth).startOf('month');
  const monthEnd = dayjs(targetMonth).endOf('month');

  const monthEvents = events.filter(event => {
    const eventDate = dayjs(event.startDate);
    return eventDate.isBetween(monthStart, monthEnd, null, '[]');
  });

  return {
    month: targetMonth.format('MMMM YYYY'),
    totalEvents: monthEvents.length,
    events: monthEvents.map(event => ({
      title: event.title,
      date: dayjs(event.startDate).format('MMM DD, YYYY'),
      dayOfWeek: dayjs(event.startDate).format('dddd'),
      fromNow: dayjs(event.startDate).fromNow()
    }))
  };
}

/**
 * Calculate statistics for date range
 */
export function calculateStats(events, startDate, endDate) {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const rangeEvents = events.filter(e => {
    const eventDate = dayjs(e.startDate);
    return eventDate.isBetween(start, end, null, '[]');
  });

  const totalDays = end.diff(start, 'days') + 1;
  const avgEventsPerDay = rangeEvents.length / totalDays;

  return {
    totalEvents: rangeEvents.length,
    totalDays,
    avgEventsPerDay: avgEventsPerDay.toFixed(2),
    periodStart: start.format('YYYY-MM-DD'),
    periodEnd: end.format('YYYY-MM-DD')
  };
}
