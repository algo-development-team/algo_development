import { fetchEvents } from 'googleCalendar'
import moment from 'moment'

// fetches all events according to user's specified day range
// considers buffer time to include events that are in the edge of the day range
export const fetchAllEventsToday = async (calendarIds) => {
  const today = moment().startOf('day')
  console.log('today:', today) // DEBUGGING
  let timeMin = today
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
  console.log('timeMin:', timeMin) // DEBUGGING
  console.log('timeMax:', timeMax) // DEBUGGING
  const events = []
  for (const calendarId of calendarIds) {
    const fetchedEvents = await fetchEvents(timeMin, timeMax, calendarId)
    events.push(...fetchedEvents)
  }
  return events
}

export const filterAllDayEvents = (events) => {
  return events.filter((event) => event.start.dateTime)
}
