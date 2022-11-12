import { useEffect, useState } from 'react'
import { gapi } from 'gapi-script'
import { useOverlayContextValue } from 'context'

export const AddChecklist = () => {
  const { setShowDialog } = useOverlayContextValue()
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    gapi.load('client:auth2', () => {
      gapi.auth2.init({
        clientId: process.env.REACT_APP_CLIENT_ID,
        scope: 'openid email profile https://www.googleapis.com/auth/calendar',
      })
    })
  }, [])

  return (
    <div>
      <button
        onClick={() => {
          if (gapi.auth2?.getAuthInstance()?.isSignedIn?.get()) {
            console.log(
              'Signed In (Google OAuth2 - Google Calendar API Access)',
            )
          } else if (!gapi.auth2) {
            console.log(
              'Not Loaded (Google OAuth2 - Google Calendar API Access)',
            )
          } else {
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
