/***
 * requirements:
 * events must not be all day events (must have start.dateTime and end.dateTime)
 * ***/
export const getTimeRangesFromEvents = (events) => {
  const timeRanges = []
  for (const event of events) {
    const start = new Date(event.start.dateTime)
    const end = new Date(event.end.dateTime)
    timeRanges.push({ start, end })
  }
  return timeRanges
}
