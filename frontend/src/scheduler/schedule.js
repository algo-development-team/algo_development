import { updateUserInfo } from 'handleUserInfo'
import { getAllUserTasks } from 'handleUserTasks'
import { fetchAllCalendarIds, insertCalendar } from 'gapiHandlers'
import { fetchEvents } from 'googleCalendar'

export const scheduleToday = async (userId) => {
  // const calendarName = 'TEST' // TESTING
  // const result = insertCalendar(calendarName) // TESTING
  // console.log('result:', result) // DEBUG
  // const events = await fetchEvents() // TESTING
  // console.log('events:', events) // DEBUG
  // const tasks = await getAllUserTasks(userId) // TESTING
  // console.log('tasks:', tasks) // DEBUG
  // const checklistToday = getChecklistToday(userId)
  // updateUserInfo(userId, { checklist: checklistToday })
}
