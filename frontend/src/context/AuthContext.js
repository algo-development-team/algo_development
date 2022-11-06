import React, { createContext, useContext, useState, useEffect } from 'react'
import { auth, createUserProfileDocument, provider } from '_firebase'
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithRedirect,
} from 'firebase/auth'
import {
  onSnapshot,
  getDocs,
  addDoc,
  updateDoc,
  collection,
  query,
  where,
} from 'firebase/firestore'
import { getAuth, updateProfile } from 'firebase/auth'
import { db } from '_firebase'
import { Navigate, useNavigate } from 'react-router-dom'

export const AuthContext = createContext()
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState({})
  const [loading, setLoading] = useState(true)
  let navigate = useNavigate()
  const authUser = getAuth()

  const setDisplayName = (name) => {
    updateProfile(authUser.currentUser, {
      displayName: name,
    }).catch((error) => {
      // An error occurred
      // ...
    })
  }
  const signinWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password).then((cred) => {
      setCurrentUser(cred.user)
      localStorage.setItem('userAuth', JSON.stringify(cred.user))
      navigate('/app/Today')
    })
  }

  const signupWithEmail = async ({ email, password, name }) => {
    //Todo: reutrn the function below and perform routing in signup component
    return createUserWithEmailAndPassword(auth, email, password).then(
      (cred) => {
        setDisplayName(name)
        setCurrentUser({ ...cred.user, displayName: name })
        localStorage.setItem('userAuth', JSON.stringify(cred.user))
        navigate('/app/Today')
      },
    )
  }

  const signinGoogle = (e) => {
    e.preventDefault()
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user // user contains the refresh token
        const userData = {
          displayName: user.displayName,
          email: user.email,
          id: user.uid,
        }
        setCurrentUser(userData)
        localStorage.setItem('userAuth', JSON.stringify(userData))
        navigate('/app/Today')
      })
      .catch((error) => {
        const errorCode = error.code
        const errorMessage = error.message
        console.log(errorCode, ':', errorMessage)
      })
  }

  const signout = () => {
    const userAuth = getAuth()

    signOut(userAuth)
      .then(() => {
        setCurrentUser(null)
        localStorage.removeItem('userAuth')
      })
      .finally(() => navigate('/'))
  }

  useEffect(() => {
    const getDefaultUserInfo = (refreshToken) => {
      const defaultRankings = new Array(24).fill(50)
      const defaultUserInfo = {
        refreshToken: refreshToken,
        workTimeRange: '9:00-17:00',
        sleepTimeRange: '23:00-07:00',
        workDays: [false, true, true, true, true, true, false],
        isSetup: false,
        calendarId: null,
        checklist: [],
        urgentRankingsWw: defaultRankings,
        deepRankingsWw: defaultRankings,
        shallowRankingsWw: defaultRankings,
        urgentRankingsPw: defaultRankings,
        deepRankingsPw: defaultRankings,
        shallowRankingsPw: defaultRankings,
        urgentRankingsPnw: defaultRankings,
        deepRankingsPnw: defaultRankings,
        shallowRankingsPnw: defaultRankings,
      }
      return defaultUserInfo
    }

    const getUserInfo = async (userId) => {
      try {
        const userInfoQuery = await query(
          collection(db, 'user', `${userId}/userInfo`),
        )
        const userInfoDocs = await getDocs(userInfoQuery)
        const userInfoDocList = []
        userInfoDocs.forEach((userInfoDoc) => {
          userInfoDocList.push(userInfoDoc)
        })
        if (userInfoDocs.empty === true) {
          return { empty: true, userInfoDoc: null, failed: false }
        }
        return { empty: false, userInfoDoc: userInfoDocList[0], failed: false }
      } catch (error) {
        console.log(error)
        return { empty: true, userInfoDoc: null, failed: true }
      }
    }

    const populateUserInfo = async (userId, refreshToken) => {
      const defaultUserInfo = getDefaultUserInfo(refreshToken)
      try {
        await addDoc(
          collection(db, 'user', `${userId}/userInfo`),
          defaultUserInfo,
        )
      } catch (error) {
        console.log(error)
      }
    }

    const updateRefreshToken = async (refreshToken, userInfoDoc) => {
      try {
        await updateDoc(userInfoDoc.ref, { refreshToken: refreshToken })
      } catch (error) {
        console.log(error)
      }
    }

    const unsubscribe = auth.onAuthStateChanged(async (userAuth) => {
      setLoading(false)
      if (userAuth) {
        // userAuth contains the refresh token
        const userRef = await createUserProfileDocument(userAuth)
        onSnapshot(userRef, async (snapshot) => {
          const snapshotData = snapshot.data()
          const userInfo = await getUserInfo(snapshot.id)
          if (userInfo.empty === true && userInfo.failed === false) {
            await populateUserInfo(snapshot.id, userAuth.refreshToken)
          } else if (userInfo.empty === false && userInfo.failed === false) {
            if (
              userInfo.userInfoDoc.data().refreshToken !== userAuth.refreshToken
            ) {
              console.log('refresh token changed')
              await updateRefreshToken(
                userAuth.refreshToken,
                userInfo.userInfoDoc,
              )
            }
          } else {
            console.log('error getting user info')
            alert('Please refresh the page')
          }

          const user = {
            displayName: snapshotData.displayName,
            email: snapshotData.email,
            id: snapshot.id,
          }
          setCurrentUser(user)

          localStorage.setItem('userAuth', JSON.stringify(user))
        })
      } else {
        setCurrentUser(userAuth)
      }
    })

    return () => unsubscribe()
  }, [])

  const authValue = {
    currentUser,
    signupWithEmail,
    signinWithEmail,
    signinGoogle,
    signout,
  }

  return (
    <AuthContext.Provider value={authValue}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
export default AuthProvider
