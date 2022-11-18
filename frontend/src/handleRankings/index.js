/***
 * note:
 * rankingsPreferences values:
 * 0: urgent
 * 1: deeep
 * 2: shallow
 * rankingPreferences index:
 * 0: early morning  | (5am-7am)  | (5, 6, 7)
 * 1: morning        | (8am-10am) | (8, 9, 10)
 * 2: noon           | (11am-1pm) | (11, 12, 13)
 * 3: afternoon      | (2pm-4pm)  | (14, 15, 16)
 * 4: late afternoon | (5pm-7pm)  | (17, 18, 19)
 * 5: evening        | (8pm-10pm) | (20, 21, 22)
 * ***/
export const getAllRankings = (rankingsPreferences) => {
  const urgentRankings = new Array(24).fill(1)
  const deepRankings = new Array(24).fill(1)
  const shallowRankings = new Array(24).fill(1)

  for (let i = 0; i < rankingsPreferences.length; i++) {
    for (let j = 0; j < 3; j++) {
      const idx = i * 3 + j + 5
      if (rankingsPreferences[i] === 0) {
        urgentRankings[idx] = 100
      } else if (rankingsPreferences[i] === 1) {
        deepRankings[idx] = 100
      } else if (rankingsPreferences[i] === 2) {
        shallowRankings[idx] = 100
      }
    }
  }

  return {
    urgentRankings: urgentRankings,
    deepRankings: deepRankings,
    shallowRankings: shallowRankings,
  }
}
