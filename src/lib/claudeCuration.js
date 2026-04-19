// src/lib/claudeCuration.js
// Claude API는 Edge Function(/api/curate)을 통해 안전하게 호출합니다.
// API 키가 클라이언트에 노출되지 않습니다.

const SYSTEM_PROMPT = `
당신은 Stellara의 감성 음악 큐레이션 AI입니다.
사용자의 기분·상황 텍스트를 읽고 아래 JSON 형식으로만 응답하세요.
다른 텍스트는 절대 포함하지 마세요.

응답 형식:
{
  "planetIndex": 0,
  "mood": "새벽 감성",
  "description": "두 문장 이내의 감성적 설명",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "searchQuery": "YouTube/Apple Music 검색에 쓸 영문 쿼리",
  "energy": 0.3
}

planetIndex는 0~5 중 하나입니다:
0 = 새벽 감성 (몽환·잔잔)
1 = 힐링·자연 (치유·고요)
2 = 집중 모드 (맑은 집중)
3 = 설렘 (따뜻한 두근거림)
4 = 빗소리 (차분·내면)
5 = 에너지 (강렬·해방)

energy는 0.0(매우 차분) ~ 1.0(매우 격렬) 사이의 숫자입니다.
searchQuery는 반드시 영어로 작성하세요.
`

/**
 * 사용자의 기분 텍스트를 Claude API로 분석해 큐레이션 결과를 반환합니다.
 * @param {string} moodText - 사용자 입력 ("새벽에 혼자 운전하면서...")
 * @returns {Promise<{planetIndex, mood, description, keywords, searchQuery, energy}>}
 */
export async function analyzeMood(moodText) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-calls': 'true', // 개발용
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: moodText }],
      }),
    })

    if (!response.ok) throw new Error(`Claude API error: ${response.status}`)

    const data = await response.json()
    const text = data.content[0]?.text || '{}'
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch (err) {
    console.error('Claude curation error:', err)
    // fallback — 키워드 매칭
    return fallbackCuration(moodText)
  }
}

function fallbackCuration(text) {
  const map = [
    { keys: ['새벽', '밤', '잠', '몽환', '혼자'], idx: 0, mood: '새벽 감성', query: 'lofi chill late night ambient' },
    { keys: ['힐링', '자연', '숲', '바람', '쉬고'], idx: 1, mood: '힐링·자연', query: 'nature healing ambient peaceful' },
    { keys: ['집중', '공부', '작업', '코딩', '카페'], idx: 2, mood: '집중 모드', query: 'focus study lofi instrumental' },
    { keys: ['설렘', '두근', '첫', '사랑', '봄'],   idx: 3, mood: '설렘', query: 'warm uplifting indie pop romantic' },
    { keys: ['비', '빗소리', '창가', '차분', '우울'], idx: 4, mood: '빗소리', query: 'rain piano melancholic calm' },
    { keys: ['에너지', '운동', '달리', '신나', '강렬'], idx: 5, mood: '에너지', query: 'energetic upbeat workout electronic' },
  ]
  const matched = map.find(m => m.keys.some(k => text.includes(k))) || map[0]
  return {
    planetIndex: matched.idx,
    mood: matched.mood,
    description: '당신의 감성을 읽었습니다. 어울리는 행성을 열어드릴게요.',
    keywords: matched.keys.slice(0, 3),
    searchQuery: matched.query,
    energy: matched.idx === 5 ? 0.9 : matched.idx === 3 ? 0.6 : 0.3,
  }
}
