import { fetchAllCalendars } from 'gapiHandlers'
import { fetchAllEvents } from './events'
import {
  getTimesWithInfo,
  getTimesWithInfoSorted,
  getAvailableTimeRanges,
  timeType,
} from './timeRanges'
import { getUserInfo } from 'handleUserInfo'
import moment from 'moment'

/***
 * Note: schedules the entire day, no matter what the current time is
 * returns checklist for the day
 * ***/
export const scheduleToday = async (userId) => {
  try {
    const userInfo = await getUserInfo(userId)
    if (userInfo.empty === true || userInfo.failed === true) {
      return { checklist: [], failed: true }
    }
    const userData = userInfo.userInfoDoc.data()
    const sleepRange = userData.sleepTimeRange
      .split('-')
      .map((time) => moment(time, 'HH:mm'))
    const dayRange = [sleepRange[1], sleepRange[0]]
    // the end of the day is in the next day
    if (dayRange[0].isAfter(dayRange[1])) {
      dayRange[1].add(1, 'day')
    }
    // now is before the start of sleep range (i.e. before 11pm of night before)
    // continues to schedule for the current day
    if (dayRange[1].clone().subtract(1, 'day').isAfter(moment())) {
      dayRange[0].subtract(1, 'day')
      dayRange[1].subtract(1, 'day')
    }
    const eventsByTypeForToday = await getEventsByTypeForToday()
    const timeRangesForDay = await getTimeRangesForDay(
      eventsByTypeForToday.timeBlocked,
      dayRange[0],
      dayRange[1],
    )
    console.log('timeRanges', timeRangesForDay) // DEBUGGING
  } catch (error) {
    console.log(error)
    return { checklist: [], failed: true }
  }
}

export const getEventsByTypeForToday = async () => {
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
  const calendars = await fetchAllCalendars()
  const calendarIds = calendars.map((calendar) => calendar.id)
  const events = await fetchAllEvents(timeMin, timeMax, calendarIds)
  const eventsByType = { timeBlocked: [], allDay: [] }
  for (const event of events) {
    if (event.start.dateTime) {
      eventsByType.timeBlocked.push(event)
    } else {
      eventsByType.allDay.push(event)
    }
  }
  return eventsByType
}

/***
 * requirements:
 * events: Google Calendar API events (time-blocked)
 * timeStartDay: moment object
 * timeEndDay: moment object
 * currently only returns available time ranges, can be expanded in future to return blocked time ranges as well
 * ***/
export const getTimeRangesForDay = async (events, timeStartDay, timeEndDay) => {
  console.log('events:', events) // DEBUGGING
  const timesWithInfo = getTimesWithInfo(events)
  const timeStartDayWithInfo = {
    time: timeStartDay,
    type: timeType.startDay,
    id: null,
  }
  const timeEndDayWithInfo = {
    time: timeEndDay,
    type: timeType.endDay,
    id: null,
  }
  const timesWithInfoCombined = [
    timeStartDayWithInfo,
    ...timesWithInfo,
    timeEndDayWithInfo,
  ]
  const timesWithInfoSorted = getTimesWithInfoSorted(timesWithInfoCombined)
  const timeRangesForDay = {
    availableTimeRanges: getAvailableTimeRanges(timesWithInfoSorted),
  }
  return timeRangesForDay
}

/***
 * performance testing example code:
const now1 = new Date() // TESTING
// SOME CODE TO TEST
const now2 = new Date() // TESTING
console.log('time taken:', now2 - now1) // DEBUGGING
***/
