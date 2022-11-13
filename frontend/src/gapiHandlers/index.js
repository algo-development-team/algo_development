/***
 * Source Code:
 * https://blog.telzee.io/calendar-events-reactjs-gapi/
 * ***/

import { gapi } from 'gapi-script'

export const initClient = (callback) => {
  const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY
  const DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
  ]
  const CLIENT_ID = process.env.REACT_APP_CLIENT_ID
  const SCOPES = 'https://www.googleapis.com/auth/calendar.events'

  gapi.load('client:auth2', () => {
    try {
      gapi.client
        .init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES,
        })
        .then(
          function () {
            if (typeof callback === 'function') {
              callback(true)
            }
          },
          function (error) {
            console.log(error)
          },
        )
    } catch (error) {
      console.log(error)
    }
  })
}

export const disconnectClient = () => {
  try {
    gapi.auth2.getAuthInstance().disconnect()
  } catch (error) {
    console.log(error)
  }
}

// 0: not loaded
// 1: signed in
// 2: not signed in
export const checkSignInStatus = async () => {
  if (!gapi.auth2) {
    return 0
  }
  let isSignedIn = await gapi.auth2?.getAuthInstance()?.isSignedIn?.get()
  if (isSignedIn) {
    return 1
  } else {
    return 2
  }
}

export const getCalendarEvents = async (fetchOption) => {
  try {
    const events = await gapi.client.calendar.events.list(fetchOption)
    return events.result.items
  } catch (error) {
    console.log(error)
  }
}

export const insertCalenderEvent = async (insertOption) => {
  try {
    const event = await gapi.client.calendar.events.insert(insertOption)
    return event.result
  } catch (error) {
    console.log(error)
  }
}

export const fetchAllCalendarIds = () => {
  try {
    let calendarIds = []
    gapi.client.load('calendar', 'v3', () => {
      const request = gapi.client.calendar.calendarList.list({})
      request.execute(function (resp) {
        if (!resp.error) {
          var calendarIds = []
          for (var i = 0; i < resp.items.length; i++) {
            calendarIds.push(resp.items[i].id)
          }
        } else {
          throw new Error(resp.error)
        }
      })
    })
    return calendarIds
  } catch (error) {
    console.log(error)
  }
}

export const insertCalendar = (summary) => {
  let result = null
  gapi.client.load('calendar', 'v3', () => {
    result = gapi.client.calendar.calendars
      .insert({
        resource: {
          summary: summary,
        },
      })
      .then(
        function (response) {
          // Handle the results here (response.result has the parsed body).
          console.log('Response', response)
        },
        function (err) {
          console.error('Execute error', err)
        },
      )
  })
  return result
}

/*** 
 * Source Code for authenticating with gapi, not used in the current implementation
 export const signInToGoogle = async () => {
   try {
     let googleuser = await gapi.auth2
      .getAuthInstance()
      .signIn({ prompt: 'consent' })
    if (googleuser) {
      return true
    }
  } catch (error) {
    console.log(error)
  }
}

export const signOutFromGoogle = () => {
  try {
    var auth2 = gapi.auth2.getAuthInstance()
    auth2.signOut().then(function () {
      auth2.disconnect()
    })
    return true
  } catch (error) {
    console.log(error)
  }
}
***/
