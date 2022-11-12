import { useEffect, useState } from 'react'
import { gapi } from 'gapi-script'
import { useOverlayContextValue } from 'context'
import { useAuth } from 'hooks'

export const AddChecklist = () => {
  const { setShowDialog } = useOverlayContextValue()
  const { currentUser } = useAuth()

  return (
    <div>
      <button
        onClick={() => {
          if (gapi.auth2?.getAuthInstance()?.isSignedIn?.get()) {
            console.log(
              'Signed In (Google OAuth2 - Google Calendar API Access)',
            )
            console.log(
              'auth2?.getAuthInstance():',
              gapi.auth2?.getAuthInstance(),
            ) // DEBUG
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
