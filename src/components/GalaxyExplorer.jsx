// src/components/GalaxyExplorer.jsx
// 다른 유저의 갤럭시(공개 플레이리스트)를 탐험하는 사이드 패널

import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { collection, query, where, orderBy, limit, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { useStore } from '../lib/store'

export default function GalaxyExplorer({ onSelectGalaxy, onClose }) {
  const { user, platform } = useStore()
  const [galaxies, setGalaxies] = useState([])
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(new Set())

  useEffect(() => {
    loadPublicGalaxies()
    if (user) loadFollowing()
  }, [user])

  async function loadPublicGalaxies() {
    try {
      const q = query(
        collection(db, 'galaxies'),
        where('isPublic', '==', true),
        orderBy('updatedAt', 'desc'),
        limit(20)
      )
      const snap = await getDocs(q)
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(g => g.uid !== user?.uid) // 본인 제외
      setGalaxies(data)
    } catch (err) {
      console.error('Galaxy load error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadFollowing() {
    const q = query(collection(db, 'follows'), where('followerId', '==', user.uid))
    const snap = await getDocs(q)
    setFollowing(new Set(snap.docs.map(d => d.data().targetGalaxyId)))
  }

  async function toggleFollow(galaxyId) {
    if (!user) return
    const followId = `${user.uid}_${galaxyId}`
    const ref = doc(db, 'follows', followId)

    if (following.has(galaxyId)) {
      await deleteDoc(ref)
      setFollowing(prev => { const s = new Set(prev); s.delete(galaxyId); return s })
    } else {
      await setDoc(ref, {
        followerId: user.uid,
        targetGalaxyId: galaxyId,
        createdAt: serverTimestamp(),
      })
      setFollowing(prev => new Set([...prev, galaxyId]))
    }
  }

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: 280,
      background: 'rgba(6,4,20,.92)', backdropFilter: 'blur(20px)',
      borderLeft: '1px solid rgba(123,112,224,.2)',
      zIndex: 40, display: 'flex', flexDirection: 'column',
      fontFamily: 'system-ui,sans-serif',
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '20px 20px 14px',
        borderBottom: '1px solid rgba(123,112,224,.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(123,112,224,.5)', marginBottom: 4 }}>
            우주 탐험
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#C4BDFF' }}>
            다른 갤럭시 발견
          </div>
        </div>
        <button onClick={onClose} style={{
          width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
          background: 'rgba(63,58,154,.3)', border: '1px solid rgba(123,112,224,.3)',
          color: 'rgba(155,145,255,.6)', fontSize: 16, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>×</button>
      </div>

      {/* 갤럭시 목록 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(155,145,255,.35)', fontSize: 12, marginTop: 40 }}>
            갤럭시를 탐색하는 중...
          </div>
        ) : galaxies.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(155,145,255,.35)', fontSize: 12, marginTop: 40 }}>
            아직 공개된 갤럭시가 없습니다
          </div>
        ) : galaxies.map(galaxy => (
          <div key={galaxy.id} style={{
            padding: '12px 14px', marginBottom: 8,
            background: 'rgba(10,8,26,.7)', border: '1px solid rgba(123,112,224,.15)',
            borderRadius: 12, cursor: 'pointer', transition: 'all .2s',
          }}
            onClick={() => onSelectGalaxy(galaxy)}
          >
            {/* 갤럭시 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: `hsl(${(galaxy.uid.charCodeAt(0) * 137) % 360}, 40%, 25%)`,
                border: '1.5px solid rgba(155,145,255,.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: '#C4BDFF', fontWeight: 500,
              }}>
                {galaxy.name?.charAt(0) || 'G'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#C4BDFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {galaxy.name}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(155,145,255,.4)' }}>
                  {galaxy.platform === 'apple' ? 'Apple Music' : galaxy.platform === 'youtube' ? 'YouTube Music' : '멀티 플랫폼'}
                </div>
              </div>
            </div>

            {/* 무드 태그 */}
            {galaxy.moodTags?.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                {galaxy.moodTags.slice(0, 3).map(tag => (
                  <span key={tag} style={{
                    fontSize: 10, color: 'rgba(155,145,255,.5)',
                    background: 'rgba(30,24,70,.6)', border: '1px solid rgba(123,112,224,.2)',
                    borderRadius: 10, padding: '2px 8px',
                  }}>{tag}</span>
                ))}
              </div>
            )}

            {/* 팔로우 버튼 */}
            {user && (
              <button
                onClick={e => { e.stopPropagation(); toggleFollow(galaxy.id) }}
                style={{
                  fontSize: 11, padding: '4px 12px', borderRadius: 10, cursor: 'pointer',
                  background: following.has(galaxy.id) ? 'rgba(63,58,154,.5)' : 'transparent',
                  border: `1px solid ${following.has(galaxy.id) ? 'rgba(155,145,255,.6)' : 'rgba(123,112,224,.25)'}`,
                  color: following.has(galaxy.id) ? '#C4BDFF' : 'rgba(155,145,255,.45)',
                  transition: 'all .2s',
                }}
              >
                {following.has(galaxy.id) ? '팔로잉' : '팔로우'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
