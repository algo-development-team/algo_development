import { fetchAllCalendars } from 'gapiHandlers'
import { fetchAllEvents, filterAllDayEvents } from './events'
import { getTimeRangesFromEvents, getEmptyTimeRanges } from './timeRanges'
import moment from 'moment'

/***
 * Note: schedules the entire day, no matter what the current time is
 * ***/
export const scheduleToday = async (userId) => {
  const now1 = new Date() // TESTING
  await getAvailableTimeRanges(userId)
  const now2 = new Date() // TESTING
  console.log('time taken (getAvailableTimeRanges()):', now2 - now1) // DEBUGGING
}

export const getAvailableTimeRanges = async (userId) => {
  const today = moment().startOf('day')
  const timeMin = today
    .clone()
    .subtract(1, 'day')
    .subtract(2, 'hour')
    .subtract(15, 'minute')
    .toISOString()
  const timeMax = today
    .clone()
    .add(2, 'day')
    .add(2, 'hour')
    .add(15, 'minute')
    .toISOString()
  const calendars = await fetchAllCalendars(userId)
  const calendarIds = calendars.map((calendar) => calendar.id)
  const events = await fetchAllEvents(timeMin, timeMax, calendarIds)
  const nonAllDayEvents = filterAllDayEvents(events)
  const sortedEvents = nonAllDayEvents.sort((a, b) =>
    a.start.dateTime > b.start.dateTime
      ? 1
      : a.start.dateTime < b.start.dateTime
      ? -1
      : 0,
  )
  const timeRanges = getTimeRangesFromEvents(sortedEvents)
  // note: timeStartDay should be "end" and timeEndDay should be "start"
  console.log('timeRanges:', timeRanges) // DEBUGGING
}
