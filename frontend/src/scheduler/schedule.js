import { fetchAllCalendars } from 'gapiHandlers'
import { fetchAllEvents } from './events'
import {
  getTimesWithInfo,
  getTimesWithInfoSorted,
  getAvailableTimeRanges,
} from './timeRanges'
import { getUserInfo } from 'handleUserInfo'
import moment from 'moment'
import { timeType } from 'components/enums'
import { getAllUserTasks } from 'handleUserTasks'
import { getAllUserProjects } from 'handleUserProjects'

const MAX_NUM_CHUNKS = 8 // 2h

/***
 * Note: schedules the entire day, no matter what the current time is
 * returns checklist for the day
 * ***/
export const scheduleToday = async (userId) => {
  try {
    //*** GETTING AVAILABLE TIME RANGES START ***//
    const userInfo = await getUserInfo(userId)
    if (userInfo.empty === true || userInfo.failed === true) {
      return { checklist: [], failed: true }
    }
    const userData = userInfo.userInfoDoc.data()
    const sleepRange = userData.sleepTimeRange
      .split('-')
      .map((time) => moment(time, 'HH:mm'))
    const workRange = userData.workTimeRange
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
    console.log('timeRangesForDay:', timeRangesForDay) // DEBUGGING
    const chunkRanges = divideTimeRangesIntoChunkRanges(
      timeRangesForDay.availableTimeRanges,
    )
    // const blocks = groupChunkRangesIntoBlocks(
    //   chunkRanges,
    //   MAX_NUM_CHUNKS,
    //   workRange[0],
    //   workRange[1],
    // )
    //*** GETTING AVAILABLE TIME RANGES END ***//

    //*** FIND TIME BLOCKS FOR USER'S TASKS START ***/
    const tasks = await getAllUserTasks(userId)
    const nonCompletedTasks = tasks.nonCompletedTasks
    const projects = await getAllUserProjects(userId)
    const projectIdToIsWork = {}
    for (const project of projects) {
      projectIdToIsWork[project.projectId] = project.projectIsWork
    }
    const formattedTasks = []
    for (const task of nonCompletedTasks) {
      const formattedTask = {
        isWork: projectIdToIsWork[task.projectId],
        priority: task.priority,
        date: task.date !== '' ? moment(task.date, 'DD-MM-YYYY') : null,
        timeLength: task.timeLength / 15,
      }
      formattedTasks.push(formattedTask)
    }
    console.log('formattedTasks:', formattedTasks) // DEBUGGING
    //*** FIND TIME BLOCKS FOR USER'S TASKS END ***/
  } catch (error) {
    console.log(error)
    return { checklist: [], failed: true }
  }
}

/***
 * Groups chunk ranges considering both max number of chunks and work range
 * HELPER FUNCTION
 * requirements:
 * chunkRanges: array of time ranges
 * chunkRanges (format): { start: moment, end: moment }[]
 * ***/
const groupChunkRangesIntoBlocks = (
  chunkRanges,
  maxNumChunks,
  workTimeStart,
  workTimeEnd,
) => {}

/***
 * HELPER FUNCTION
 * requirements:
 * timeRanges: array of time ranges
 * timeRanges (format): { start: moment, end: moment }[]
 * ***/
const divideTimeRangesIntoChunkRanges = (timeRanges) => {
  const chunkRanges = []
  for (const timeRange of timeRanges) {
    const chunkRange = []
    const currentChunk = timeRange.start.clone()
    while (currentChunk.isBefore(timeRange.end)) {
      chunkRange.push({
        start: currentChunk.clone(),
        end: currentChunk.clone().add(15, 'minute'),
      })
      currentChunk.add(15, 'minute')
    }
    chunkRanges.push(chunkRange)
  }
  return chunkRanges
}

/***
 * HELPER FUNCTION
 * ***/
const getEventsByTypeForToday = async () => {
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
 * HELPER FUNCTION
 * requirements:
 * events: Google Calendar API events (time-blocked)
 * timeStartDay: moment object
 * timeEndDay: moment object
 * currently only returns available time ranges, can be expanded in future to return blocked time ranges as well
 * ***/
const getTimeRangesForDay = async (events, timeStartDay, timeEndDay) => {
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
  timesWithInfo.push(timeStartDayWithInfo)
  timesWithInfo.push(timeEndDayWithInfo)
  const timesWithInfoSorted = getTimesWithInfoSorted(timesWithInfo)
  const timeRangesForDay = {
    availableTimeRanges: getAvailableTimeRanges(timesWithInfoSorted),
  }
  return timeRangesForDay
}
