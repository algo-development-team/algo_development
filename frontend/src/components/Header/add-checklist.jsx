import { useOverlayContextValue } from 'context'
import { checkSignInStatus } from 'gapiHandlers'
import { scheduleToday } from 'scheduler/schedule'
import { useAuth } from 'hooks'
import { fetchEvents } from 'googleCalendar'
import moment from 'moment'

export const AddChecklist = () => {
  const { setShowDialog } = useOverlayContextValue()
  const { currentUser } = useAuth()

  return (
    <div>
      <button
        onClick={async () => {
          const signInStatus = await checkSignInStatus()
          if (signInStatus === 0) {
            console.log(
              'Not Loaded (Google OAuth2 - Google Calendar API Access)',
            )
          } else if (signInStatus === 1) {
            console.log(
              'Signed In (Google OAuth2 - Google Calendar API Access)',
            )
            // Calling Scheduler Algorithm
            scheduleToday(currentUser.id)
          } else if (signInStatus === 2) {
            console.log(
              'Not Signed In (Google OAuth2 - Google Calendar API Access)',
            )
            setShowDialog('GOOGLE_CALENDAR_AUTH')
          }
        }}
        style={{ color: 'white' }}
      >
        Generate Schedule
      </button>
    </div>
  )
}
