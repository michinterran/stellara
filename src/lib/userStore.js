// src/lib/userStore.js
// Firestore에 유저 데이터, 플레이리스트, 베타 신청 정보를 저장/조회합니다.

import {
  doc, getDoc, setDoc, updateDoc, arrayUnion,
  collection, addDoc, query, where, getDocs, serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// ── 유저 프로필 ───────────────────────────────────────────────

/**
 * 로그인 후 Firestore에 유저 문서를 생성 또는 업데이트합니다.
 */
export async function upsertUser(user) {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      uid:         user.uid,
      email:       user.email,
      displayName: user.displayName,
      photoURL:    user.photoURL,
      createdAt:   serverTimestamp(),
      platform:    'none',       // 'apple' | 'youtube' | 'both'
      moodHistory: [],
      savedPlanets: [],
    })
  }
}

/**
 * 연결된 음악 플랫폼을 저장합니다.
 * @param {string} uid
 * @param {'apple'|'youtube'|'both'} platform
 */
export async function savePlatform(uid, platform) {
  await updateDoc(doc(db, 'users', uid), { platform })
}

/**
 * 유저의 기분 검색 기록을 저장합니다.
 * @param {string} uid
 * @param {string} moodText
 * @param {object} curationResult - Claude가 반환한 큐레이션 결과
 */
export async function saveMoodHistory(uid, moodText, curationResult) {
  await updateDoc(doc(db, 'users', uid), {
    moodHistory: arrayUnion({
      text:      moodText,
      result:    curationResult,
      timestamp: new Date().toISOString(),
    }),
  })
}

/**
 * 유저 데이터를 조회합니다.
 */
export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

// ── 베타 신청 ─────────────────────────────────────────────────

/**
 * 베타 신청 정보를 Firestore에 저장합니다.
 * @param {string} email
 * @param {'apple'|'youtube'|'both'} platform
 */
export async function submitBetaRequest(email, platform) {
  // 중복 체크
  const q = query(collection(db, 'betaRequests'), where('email', '==', email))
  const existing = await getDocs(q)
  if (!existing.empty) return { success: false, reason: 'already_registered' }

  await addDoc(collection(db, 'betaRequests'), {
    email,
    platform,
    createdAt: serverTimestamp(),
    status: 'pending', // pending | invited | active
  })

  return { success: true }
}

// ── 플레이리스트 행성 저장 ────────────────────────────────────

/**
 * 유저가 저장한 행성(플레이리스트)을 Firestore에 저장합니다.
 */
export async function savePlanet(uid, planet) {
  await updateDoc(doc(db, 'users', uid), {
    savedPlanets: arrayUnion({
      ...planet,
      savedAt: new Date().toISOString(),
    }),
  })
}
