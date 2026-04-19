// src/hooks/useAuth.js
import { useEffect } from 'react'
import {
  signInWithPopup, signOut, onAuthStateChanged,
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { useStore } from '../lib/store'
import { upsertUser } from '../lib/userStore'

export function useAuth() {
  const { user, setUser } = useStore()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await upsertUser(firebaseUser)
        setUser(firebaseUser)
      } else {
        setUser(null)
      }
    })
    return () => unsub()
  }, [])

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      return result.user
    } catch (err) {
      console.error('Google sign-in error:', err)
      throw err
    }
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
  }

  return { user, signInWithGoogle, logout }
}
