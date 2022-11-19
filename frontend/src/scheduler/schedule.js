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
import { getPreferences } from 'handlePreferences'

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
    const now = moment()
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
    // the end of the work time is in the next day
    if (workRange[0].isAfter(workRange[1])) {
      workRange[1].add(1, 'day')
    }
    // now is before the start of sleep range (i.e. before 11pm of night before)
    // continues to schedule for the current day
    if (dayRange[1].clone().subtract(1, 'day').isAfter(now)) {
      dayRange[0].subtract(1, 'day')
      dayRange[1].subtract(1, 'day')
      workRange[0].subtract(1, 'day')
      workRange[1].subtract(1, 'day')
    }
    // console.log('dayRange[0]:', dayRange[0].format('MM-DD HH:mm')) // DEBUGGING
    // console.log('dayRange[1]:', dayRange[1].format('MM-DD HH:mm')) // DEBUGGING
    // console.log('workRange[0]:', workRange[0].format('MM-DD HH:mm')) // DEBUGGING
    // console.log('workRange[1]:', workRange[1].format('MM-DD HH:mm')) // DEBUGGING
    const eventsByTypeForToday = await getEventsByTypeForToday(now)
    const timeRangesForDay = await getTimeRangesForDay(
      eventsByTypeForToday.timeBlocked,
      dayRange[0],
      dayRange[1],
    )
    const chunkRanges = divideTimeRangesIntoChunkRanges(
      timeRangesForDay.availableTimeRanges,
    )
    const hasWorkTime = userData.workDays[workRange[1].day()]
    const blocks = groupChunkRangesIntoBlocks(
      chunkRanges,
      MAX_NUM_CHUNKS,
      workRange[0],
      workRange[1],
      hasWorkTime,
    )
    printBlocks(blocks.work, 'work') // DEBUGGING
    printBlocks(blocks.personal, 'personal') // DEBUGGING
    const blocksOfChunksWithRanking = {
      work: rankBlocksOfChunks(blocks.work, userData.rankingPreferences),
      personal: rankBlocksOfChunks(
        blocks.personal,
        userData.rankingPreferences,
      ),
    }
    console.log('blocksOfChunksWithRanking', blocksOfChunksWithRanking) // DEBUGGING
    //*** GETTING AVAILABLE TIME RANGES END ***//

    //*** FIND TIME BLOCKS FOR USER'S TASKS START ***/
    const tasks = await getAllUserTasks(userId)
    const projects = await getAllUserProjects(userId)
    const tasksNotPassedDeadline = filterTaskNotPassedDeadline(
      tasks.nonCompleted,
      now,
    )
    const formattedTasks = formatTasks(tasksNotPassedDeadline, projects)
    // console.log('formattedTasks:', formattedTasks) // DEBUGGING
    //*** FIND TIME BLOCKS FOR USER'S TASKS END ***/

    //*** CALCULATE THE RELATIVE PRIORITY OF EACH TASK AND ASSIGN TIME BLOCKS START ***/
    const t1 = new Date()
    assignTimeBlocks(blocksOfChunksWithRanking.work, formattedTasks.work, now)
    assignTimeBlocks(
      blocksOfChunksWithRanking.personal,
      formattedTasks.personal,
      now,
    )
    const t2 = new Date()
    console.log(t2 - t1)
    //*** CALCULATE THE RELATIVE PRIORITY OF EACH TASK AND ASSIGN TIME BLOCKS END ***/
  } catch (error) {
    console.log(error)
    return { checklist: [], failed: true }
  }
}

const filterTaskNotPassedDeadline = (tasks, now) => {
  return tasks.filter((task) => {
    if (task.date === '') return true
    const deadline = moment(task.date, 'DD-MM-YYYY')
    return deadline.isAfter(now, 'day') || deadline.isSame(now, 'day')
  })
}

/***
 * requirements:
 * blocks: { start, end, preference }[][]
 * tasks: { priority, date, timeLength }[]
 * ***/
const assignTimeBlocks = (blocks, tasks, now) => {
  // iterate over blocks
  for (let i = 0; i < blocks.length; i++) {
    // iterate over chunks
    for (let j = 0; j < blocks[i].length; j++) {
      // iterate over tasks
      for (let k = 0; k < tasks.length; k++) {
        // calculate the relative priority of the task
        const params = {
          priority: tasks[k].priority,
          diffDate: now.diff(tasks[k].date, 'days'),
          timeLength: tasks[k].timeLength,
          diffTimeLength: Math.abs(
            tasks[k].timeLength - (blocks[i].length - j),
          ),
          preference: blocks[i][j].preference,
        }
        // console.log('params:', params) // DEBUGGING
      }
    }
  }
}

const formatTasks = (tasks, projects) => {
  const projectIdToIsWork = {}
  for (const project of projects) {
    projectIdToIsWork[project.projectId] = project.projectIsWork
  }
  const formattedWorkTasks = []
  const formattedPersonalTasks = []
  for (const task of tasks) {
    const formattedTask = {
      priority: task.priority,
      date: task.date !== '' ? moment(task.date, 'DD-MM-YYYY') : null,
      timeLength: task.timeLength / 15,
    }
    if (projectIdToIsWork[task.projectId]) {
      formattedWorkTasks.push(formattedTask)
    } else {
      formattedPersonalTasks.push(formattedTask)
    }
  }
  return {
    work: formattedWorkTasks,
    personal: formattedPersonalTasks,
  }
}

/***
 * requirements:
 * blocks: { start, end }[][]
 * ***/
const rankBlocksOfChunks = (blocks, rankingPreferences) => {
  const preferences = getPreferences(rankingPreferences)
  return blocks.map((block) =>
    block.map((chunk) => {
      return {
        start: chunk.start,
        end: chunk.end,
        preference: preferences[chunk.start.hour()],
      }
    }),
  )
}

/***
 * DEBUGGING PURPOSES ONLY
 * requirements:
 * blocks: { start, end, preference }[][]
 * blockType: string
 * ***/
const printBlocks = (blocks, blockType) => {
  console.log(blockType + ':')
  for (const block of blocks) {
    console.log('-'.repeat(15))
    for (const chunk of block) {
      console.log(chunk.start.format('HH:mm'), '-', chunk.end.format('HH:mm'))
    }
    console.log('-'.repeat(15))
  }
}

/***
 * requirements:
 * arr: array of items
 * size: size of each subarr
 * ***/
function sliceIntoSubarr(arr, size) {
  const subarrs = []
  for (let i = 0; i < arr.length; i += size) {
    const subarr = arr.slice(i, i + size)
    subarrs.push(subarr)
  }
  return subarrs
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
  hasWorkTime,
) => {
  let workBlocks = []
  let personalBlocks = []
  // divide chunk ranges into work and personal blocks
  for (const chunkRange of chunkRanges) {
    const workChunkRanges = []
    const personalChunkRanges = []
    let workChunkRange = []
    let personalChunkRange = []
    let isLastChunkWork = false
    let isLastChunkPersonal = false
    for (const chunk of chunkRange) {
      if (hasWorkTime) {
        if (
          (chunk.start.isSame(workTimeStart) ||
            chunk.start.isAfter(workTimeStart)) &&
          (chunk.end.isSame(workTimeEnd) || chunk.end.isBefore(workTimeEnd))
        ) {
          if (isLastChunkPersonal) {
            personalChunkRanges.push(personalChunkRange)
            personalChunkRange = []
            isLastChunkPersonal = false
          }
          workChunkRange.push(chunk)
          isLastChunkWork = true
        } else {
          if (isLastChunkWork) {
            workChunkRanges.push(workChunkRange)
            workChunkRange = []
            isLastChunkWork = false
          }
          personalChunkRange.push(chunk)
          isLastChunkPersonal = true
        }
      } else {
        personalChunkRange.push(chunk)
      }
    }
    if (workChunkRange.length > 0) workChunkRanges.push(workChunkRange)
    if (personalChunkRange.length > 0)
      personalChunkRanges.push(personalChunkRange)
    workBlocks = workBlocks.concat(workChunkRanges)
    personalBlocks = personalBlocks.concat(personalChunkRanges)
  }
  // divide blocks into blocks of (maxNumChunks >= number of chunks in a block)
  const workBlocksSliced = []
  const personalBlocksSliced = []
  for (const block of workBlocks) {
    const slicedBlock = sliceIntoSubarr(block, maxNumChunks)
    workBlocksSliced.push(...slicedBlock)
  }
  for (const block of personalBlocks) {
    const slicedBlock = sliceIntoSubarr(block, maxNumChunks)
    personalBlocksSliced.push(...slicedBlock)
  }
  return {
    work: workBlocksSliced,
    personal: personalBlocksSliced,
  }
}

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
      const chunk = {
        start: currentChunk.clone(),
        end: currentChunk.clone().add(15, 'minute'),
      }
      chunkRange.push(chunk)
      currentChunk.add(15, 'minute')
    }
    chunkRanges.push(chunkRange)
  }
  return chunkRanges
}

const getEventsByTypeForToday = async (now) => {
  const today = now.startOf('day')
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
const getTimeRangesForDay = async (events, timeStartDay, timeEndDay) => {
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
