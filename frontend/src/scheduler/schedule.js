import { fetchAllCalendars } from 'gapiHandlers'
import { fetchAllEventsToday, filterAllDayEvents } from './events'
import { getTimeRangesFromEvents } from './timeRanges'

export const scheduleToday = async (userId) => {
  const now1 = new Date() // TESTING
  const calendars = await fetchAllCalendars(userId)
  const calendarIds = calendars.map((calendar) => calendar.id)
  console.log('calendars:', calendars) // DEBUGGING
  console.log('calendarIds:', calendarIds) // DEBUGGING
  const events = await fetchAllEventsToday(calendarIds)
  const nonAllDayEvents = filterAllDayEvents(events)
  const sortedEvents = nonAllDayEvents.sort((a, b) =>
    a.start.dateTime > b.start.dateTime
      ? 1
      : a.start.dateTime < b.start.dateTime
      ? -1
      : 0,
  )
  console.log('sortedEvents:', sortedEvents) // DEBUGGING
  const timeRanges = getTimeRangesFromEvents(sortedEvents)
  console.log('timeRanges:', timeRanges) // DEBUGGING
  const now2 = new Date() // TESTING
  console.log('time taken:', now2 - now1) // DEBUGGING
}
