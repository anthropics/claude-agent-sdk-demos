// Report generation using moment.js
import moment from 'moment';

/**
 * Generate monthly event report
 */
export function generateReport(events, month) {
  const targetMonth = moment(month);
  const monthStart = moment(targetMonth).startOf('month');
  const monthEnd = moment(targetMonth).endOf('month');

  const monthEvents = events.filter(event => {
    const eventDate = moment(event.startDate);
    return eventDate.isBetween(monthStart, monthEnd, null, '[]');
  });

  return {
    month: targetMonth.format('MMMM YYYY'),
    totalEvents: monthEvents.length,
    events: monthEvents.map(event => ({
      title: event.title,
      date: moment(event.startDate).format('MMM DD, YYYY'),
      dayOfWeek: moment(event.startDate).format('dddd'),
      fromNow: moment(event.startDate).fromNow()
    }))
  };
}

/**
 * Calculate statistics for date range
 */
export function calculateStats(events, startDate, endDate) {
  const start = moment(startDate);
  const end = moment(endDate);
  const rangeEvents = events.filter(e => {
    const eventDate = moment(e.startDate);
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
