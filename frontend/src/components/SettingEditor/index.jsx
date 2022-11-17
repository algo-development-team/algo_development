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

// note:
// 1. logic and updating fields
// 2. handling update to Firebase
// 3. error handling
// 4. styling

const timeRangeType = Object.freeze({
  sleepStart: 0,
  sleepEnd: 1,
  workStart: 2,
  workEnd: 3,
})

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
      .map((time) => time.map((hourMin) => parseInt(hourMin)))
    const workTimesData = userInfo.workTimeRange
      .split('-')
      .map((time) => time.split(':'))
      .map((time) => time.map((hourMin) => parseInt(hourMin)))
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

  const applyChangeTime = (hour, min, timeRangeTypeVal) => {
    switch (timeRangeTypeVal) {
      case timeRangeType.sleepStart:
        setSleepStartTimeHour(hour)
        setSleepStartTimeMin(min)
        break
      case timeRangeType.sleepEnd:
        setSleepEndTimeHour(hour)
        setSleepEndTimeMin(min)
        break
      case timeRangeType.workStart:
        setWorkStartTimeHour(hour)
        setWorkStartTimeMin(min)
        break
      case timeRangeType.workEnd:
        setWorkEndTimeHour(hour)
        setWorkEndTimeMin(min)
        break
      default:
        break
    }
  }

  const getTimeFromTimeRangeType = (timeRangeTypeVal) => {
    let hour = 0
    let min = 0
    if (timeRangeTypeVal === timeRangeType.sleepStart) {
      hour = sleepStartTimeHour
      min = sleepStartTimeMin
    } else if (timeRangeTypeVal === timeRangeType.sleepEnd) {
      hour = sleepEndTimeHour
      min = sleepEndTimeMin
    } else if (timeRangeTypeVal === timeRangeType.workStart) {
      hour = workStartTimeHour
      min = workStartTimeMin
    } else if (timeRangeTypeVal === timeRangeType.workEnd) {
      hour = workEndTimeHour
      min = workEndTimeMin
    }
    return { hour: hour, min: min }
  }

  const calcChangeTime = (isInc, isHour, timeRangeTypeVal) => {
    let { hour, min } = getTimeFromTimeRangeType(timeRangeTypeVal)
    if (isInc && isHour) {
      hour += 1
    } else if (!isInc && isHour) {
      hour -= 1
    } else if (isInc && !isHour) {
      min += 15
    } else if (!isInc && !isHour) {
      min -= 15
    }

    if (min > 45) {
      hour += 1
      min = 0
    } else if (min < 0) {
      hour -= 1
      min = 45
    }
    if (hour > 23) {
      hour = 0
    } else if (hour < 0) {
      hour = 23
    }
    return { hour: hour, min: min }
  }

  const isBetween = (
    hour,
    min,
    timeRangeTypeValFirst,
    timeRangeTypeValSecond,
    isInclusive,
  ) => {
    let totalMinTest = hour * 60 + min
    const timeFirst = getTimeFromTimeRangeType(timeRangeTypeValFirst)
    let totalMinFirst = timeFirst.hour * 60 + timeFirst.min
    const timeSecond = getTimeFromTimeRangeType(timeRangeTypeValSecond)
    const totalMinSecond = timeSecond.hour * 60 + timeSecond.min

    if (totalMinFirst > totalMinSecond) {
      totalMinFirst -= 1440
    }
    if (totalMinTest > totalMinSecond) {
      totalMinTest -= 1440
    }
    if (isInclusive) {
      return totalMinTest >= totalMinFirst && totalMinTest <= totalMinSecond
    } else {
      return totalMinTest > totalMinFirst && totalMinTest < totalMinSecond
    }
  }

  const validateChangeTime = (hour, min, timeRangeTypeVal) => {
    if (timeRangeTypeVal === timeRangeType.sleepStart) {
      return (
        !isBetween(
          hour,
          min,
          timeRangeType.workStart,
          timeRangeType.workEnd,
          true,
        ) &&
        isBetween(
          hour,
          min,
          timeRangeType.workEnd,
          timeRangeType.sleepEnd,
          false,
        )
      )
    } else if (timeRangeTypeVal === timeRangeType.sleepEnd) {
      return (
        !isBetween(
          hour,
          min,
          timeRangeType.workEnd,
          timeRangeType.sleepStart,
          true,
        ) &&
        isBetween(
          hour,
          min,
          timeRangeType.sleepStart,
          timeRangeType.workStart,
          false,
        )
      )
    } else if (timeRangeTypeVal === timeRangeType.workStart) {
      return (
        !isBetween(
          hour,
          min,
          timeRangeType.sleepStart,
          timeRangeType.sleepEnd,
          true,
        ) &&
        isBetween(
          hour,
          min,
          timeRangeType.sleepEnd,
          timeRangeType.workEnd,
          false,
        )
      )
    } else if (timeRangeTypeVal === timeRangeType.workEnd) {
      return (
        !isBetween(
          hour,
          min,
          timeRangeType.sleepEnd,
          timeRangeType.workStart,
          true,
        ) &&
        isBetween(
          hour,
          min,
          timeRangeType.workStart,
          timeRangeType.sleepStart,
          false,
        )
      )
    }
  }

  const changeTime = (isInc, isHour, timeRangeTypeVal) => {
    const changeInTime = calcChangeTime(isInc, isHour, timeRangeTypeVal)
    const validationResult = validateChangeTime(
      changeInTime.hour,
      changeInTime.min,
      timeRangeTypeVal,
    )
    if (validationResult) {
      applyChangeTime(changeInTime.hour, changeInTime.min, timeRangeTypeVal)
    } else {
      // error handling
    }
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
            <span>{sleepStartTimeHour}</span>
            <button
              onClick={() => changeTime(true, true, timeRangeType.sleepStart)}
            >
              up
            </button>
            <button
              onClick={() => changeTime(false, true, timeRangeType.sleepStart)}
            >
              down
            </button>
            <span>{sleepStartTimeMin}</span>
            <button
              onClick={() => changeTime(true, false, timeRangeType.sleepStart)}
            >
              up
            </button>
            <button
              onClick={() => changeTime(false, false, timeRangeType.sleepStart)}
            >
              down
            </button>
            <span>{sleepEndTimeHour}</span>
            <button
              onClick={() => changeTime(true, true, timeRangeType.sleepEnd)}
            >
              up
            </button>
            <button
              onClick={() => changeTime(false, true, timeRangeType.sleepEnd)}
            >
              down
            </button>
            <span>{sleepEndTimeMin}</span>
            <button
              onClick={() => changeTime(true, false, timeRangeType.sleepEnd)}
            >
              up
            </button>
            <button
              onClick={() => changeTime(false, false, timeRangeType.sleepEnd)}
            >
              down
            </button>
          </div>
          <div>
            <span>{workStartTimeHour}</span>
            <button
              onClick={() => changeTime(true, true, timeRangeType.workStart)}
            >
              up
            </button>
            <button
              onClick={() => changeTime(false, true, timeRangeType.workStart)}
            >
              down
            </button>
            <span>{workStartTimeMin}</span>
            <button
              onClick={() => changeTime(true, false, timeRangeType.workStart)}
            >
              up
            </button>
            <button
              onClick={() => changeTime(false, false, timeRangeType.workStart)}
            >
              down
            </button>
            <span>{workEndTimeHour}</span>
            <button
              onClick={() => changeTime(true, true, timeRangeType.workEnd)}
            >
              up
            </button>
            <button
              onClick={() => changeTime(false, true, timeRangeType.workEnd)}
            >
              down
            </button>
            <span>{workEndTimeMin}</span>
            <button
              onClick={() => changeTime(true, false, timeRangeType.workEnd)}
            >
              up
            </button>
            <button
              onClick={() => changeTime(false, false, timeRangeType.workEnd)}
            >
              down
            </button>
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
