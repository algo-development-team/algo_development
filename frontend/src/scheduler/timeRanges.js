import moment from 'moment'
import { roundUp15Min, roundDown15Min } from 'handleMoment'

/***
 * requirements:
 * events must not be all day events (must have start.dateTime and end.dateTime)
 * ***/
export const getTimeRangesFromEvents = (events) => {
  const timeRanges = []
  for (const event of events) {
    const start = roundDown15Min(moment(event.start.dateTime))
    const end = roundUp15Min(moment(event.end.dateTime))
    timeRanges.push({ start, end })
  }
  return timeRanges
}

export const getEmptyTimeRanges = (timeStartDay, timeEndDay, timeRanges) => {}
