import { collection, getDocs, query } from 'firebase/firestore'
import { db } from '_firebase'

export const getAllUserTasks = async (userId) => {
  const taskQuery = await query(collection(db, 'user', `${userId}/tasks`))
  const taskDocs = await getDocs(taskQuery)
  const tasks = []
  taskDocs.forEach((taskDoc) => {
    tasks.push(taskDoc.data())
  })
  return tasks
}
