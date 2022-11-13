import { getCalendarEvents, insertCalenderEvent } from 'gapiHandlers'

export const fetchEvents = async (calendarId = 'primary', maxResults = 10) => {
  const fetchOption = {
    calendarId: calendarId,
    timeMin: new Date().toISOString(),
    showDeleted: false,
    singleEvents: true,
    maxResults: maxResults,
    orderBy: 'startTime',
  }
  const events = await getCalendarEvents(fetchOption)
  return events
}

export const insertEvent = async (
  calendarId = 'primary',
  startDateTime,
  endDateTime,
  timeZone,
  summary,
  description,
) => {
  // the passed dateTimes should already be in the correct format
  // dateTime format example: '2015-05-28T09:00:00-07:00'
  const insertOption = {
    calendarId: calendarId,
    start: {
      dateTime: startDateTime,
      timeZone: timeZone,
    },
    end: {
      dateTime: endDateTime,
      timeZone: timeZone,
    },
    summary: summary,
    description: description,
  }

  const item = await insertCalenderEvent(insertOption)
  return item
}
