import featherIcon from 'assets/svg/feather-sprite.svg'
import { useThemeContextValue } from 'context'
import { useTaskEditorContextValue } from 'context/board-task-editor-context'
import {
  addDoc,
  collection,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { useAuth, useProjects, useSelectedProject } from 'hooks'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '_firebase'
import './styles/main.scss'
import './styles/light.scss'
import { getUserInfo } from '../../handleUserInfo'

// note: build the logic first, then deal with error handling
// note: implement a time handler function

export const SettingEditor = ({ closeOverlay }) => {
  const { currentUser } = useAuth()
  const [defaultUserInfo, setDefaultUserInfo] = useState(null)
  const [sleepStartTimeHour, setSleepStartTimeHour] = useState(0)
  const [sleepStartTimeMin, setSleepStartTimeMin] = useState(0)
  const [sleepEndTimeHour, setSleepEndTimeHour] = useState(0)
  const [sleepEndTimeMin, setSleepEndTimeMin] = useState(0)
  const [workStartTimeHour, setWorkStartTimeHour] = useState(0)
  const [workStartTimeMin, setWorkStartTimeMin] = useState(0)
  const [workEndTimeHour, setWorkEndTimeHour] = useState(0)
  const [workEndTimeMin, setWorkEndTimeMin] = useState(0)
  const [workDays, setWorkDays] = useState(new Array(7).fill(false))
  const [rankingPreferences, setRankingsPreferences] = useState(
    new Array(6).fill(0),
  )
  const [disabled, setDisabled] = useState(true)
  const { isLight } = useThemeContextValue()

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (currentUser) {
        const userInfoData = await getUserInfo(currentUser.id)
        const userInfo = userInfoData.userInfoDoc.data()
        setDefaultUserInfo(userInfo)
        initializeUserInfo(userInfo)
      }
    }

    fetchUserInfo()
  }, [])

  const initializeUserInfo = (userInfo) => {
    const sleepTimesData = userInfo.sleepTimeRange
      .split('-')
      .map((time) => time.split(':'))
    const workTimesData = userInfo.workTimeRange
      .split('-')
      .map((time) => time.split(':'))
    setSleepStartTimeHour(sleepTimesData[0][0])
    setSleepStartTimeMin(sleepTimesData[0][1])
    setSleepEndTimeHour(sleepTimesData[1][0])
    setSleepEndTimeMin(sleepTimesData[1][1])
    setWorkStartTimeHour(workTimesData[0][0])
    setWorkStartTimeMin(workTimesData[0][1])
    setWorkEndTimeHour(workTimesData[1][0])
    setWorkEndTimeMin(workTimesData[1][1])
    setWorkDays(userInfo.workDays)
    setRankingsPreferences(userInfo.rankingPreferences)
  }

  // note: might not need?
  const resetForm = (event) => {
    event?.preventDefault()
    initializeUserInfo(defaultUserInfo)
    closeOverlay()
  }

  const handleChange = (e) => {
    e.target.value.length < 1 ? setDisabled(true) : setDisabled(false)
  }

  const updateUserInfoInFirestore = async (e) => {
    e.preventDefault()
    // update user info here
  }

  return (
    <div
      className={'add-task__wrapper quick-add__wrapper'}
      onClick={(event) => {
        event.stopPropagation()
      }}
    >
      <form
        className='add-task'
        onSubmit={(event) => updateUserInfoInFirestore(event)}
        style={{ width: '100%' }}
      >
        <div className={'add-task__actions quick-add__actions'}>
          <div>
            <input
              type='number'
              value={sleepStartTimeHour}
              onChange={(event) => {
                handleChange(event)
                setSleepStartTimeHour(event.target.value)
              }}
            />
            <input
              type='number'
              step='15'
              min='0'
              max='60'
              readonly
              value={sleepStartTimeMin}
              onChange={(event) => {
                handleChange(event)
                setSleepStartTimeMin(event.target.value)
              }}
            />
            <input
              type='number'
              value={sleepEndTimeHour}
              onChange={(event) => {
                handleChange(event)
                setSleepEndTimeHour(event.target.value)
              }}
            />
            <input
              type='number'
              step='15'
              min='0'
              max='60'
              value={sleepEndTimeMin}
              onChange={(event) => {
                handleChange(event)
                setSleepEndTimeMin(event.target.value)
              }}
            />
          </div>
          <button
            className=' action add-task__actions--add-task'
            type='submit'
            disabled={defaultUserInfo ? false : disabled}
          >
            {defaultUserInfo ? 'Save' : 'Loading'}
          </button>
          <button
            className={` action  ${
              isLight ? 'action__cancel' : 'action__cancel--dark'
            }`}
            onClick={(event) => closeOverlay()}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
