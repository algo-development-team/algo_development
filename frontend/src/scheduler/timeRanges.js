import moment from 'moment'
import { roundUp15Min, roundDown15Min } from 'handleMoment'

export const timeType = Object.freeze({
  startEvent: 0,
  endEvent: 1,
  startDay: 2,
  endDay: 3,
})

/***
 * requirements:
 * events must not be all day events (must have start.dateTime and end.dateTime)
 * ***/
export const getTimesWithInfo = (events) => {
  const timesWithInfo = []
  for (const event of events) {
    const timeStartEvent = roundDown15Min(moment(event.start.dateTime))
    const timeEndEvent = roundUp15Min(moment(event.end.dateTime))
    timesWithInfo.push({
      time: timeStartEvent,
      type: timeType.startEvent,
      id: event.id,
    })
    timesWithInfo.push({
      time: timeEndEvent,
      type: timeType.endEvent,
      id: event.id,
    })
  }
  return timesWithInfo
}

/***
 * requirements:
 * timesWithInfo: { time: moment object, type: timeType }
 * ***/
export const getTimesWithInfoSorted = (timesWithInfo) => {
  const timesWithInfoSorted = timesWithInfo.sort((a, b) =>
    a.time > b.time ? 1 : a.time < b.time ? -1 : 0,
  )
  return timesWithInfoSorted
}

/***
 * requirements:
 * timesWithInfo: { time: moment object, type: timeType }
 * timesWithInfo must be sorted by time
 * currently just getting the available time ranges within the day
 * ***/
export const getTimeRanges = (timesWithInfo) => {
  console.log('timesWithInfo:', timesWithInfo) // DEBUGGING
  const emptyTimeRanges = []
  let dayStarted = false
  let startEmptyTimeRangeIdx = -1
  for (let i = 0; i < timesWithInfo.length; i++) {
    // makes sure only empty time ranges within the day are considered
    if (timesWithInfo[i].type === timeType.startDay) {
      dayStarted = true
    } else if (timesWithInfo[i].type === timeType.endDay) {
      dayStarted = false
    }

    if (
      timesWithInfo[i].type === timeType.startDay ||
      timesWithInfo[i].type === timeType.endEvent
    ) {
      if (dayStarted) {
        startEmptyTimeRangeIdx = i
      }
    } else if (
      timesWithInfo[i].type === timeType.endDay ||
      timesWithInfo[i].type === timeType.startEvent
    ) {
      if (startEmptyTimeRangeIdx !== -1) {
        emptyTimeRanges.push({
          start: timesWithInfo[startEmptyTimeRangeIdx].time,
          end: timesWithInfo[i].time,
        })
      }
      startEmptyTimeRangeIdx = -1
    }
  }
  return emptyTimeRanges
}
