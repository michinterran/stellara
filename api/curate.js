// api/curate.js  ← Vercel Edge Function
// Claude API 키를 서버사이드에서만 사용하기 위한 프록시
// 클라이언트에 API 키 노출 없이 감성 큐레이션을 처리합니다

export const config = { runtime: 'edge' }

const SYSTEM_PROMPT = `
당신은 Stellara의 감성 음악 큐레이션 AI입니다.
사용자의 기분·상황 텍스트를 읽고 아래 JSON 형식으로만 응답하세요.
다른 텍스트나 마크다운은 절대 포함하지 마세요.

응답 형식:
{
  "planetIndex": 0,
  "mood": "새벽 감성",
  "description": "두 문장 이내의 감성적 설명",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "searchQuery": "YouTube/Apple Music 검색에 쓸 영문 쿼리 (5단어 이내)",
  "energy": 0.3
}

planetIndex는 0~5 중 하나입니다:
0 = 새벽 감성 (몽환·잔잔) — 새벽, 밤, 잠못드는, 혼자, 조용한
1 = 힐링·자연 (치유·고요) — 힐링, 자연, 숲, 바람, 쉬고싶은, 위로
2 = 집중 모드 (맑은 집중) — 집중, 공부, 작업, 코딩, 카페, 로파이
3 = 설렘 (따뜻한 두근거림) — 설렘, 두근, 사랑, 봄, 행복, 신나는
4 = 빗소리 (차분·내면) — 비, 빗소리, 우울, 감성적, 차분, 슬픈
5 = 에너지 (강렬·해방) — 에너지, 운동, 달리기, 신남, 강렬, 해방

energy: 0.0(매우 차분) ~ 1.0(매우 격렬)
searchQuery: 반드시 영어, Spotify/Apple Music에서 잘 검색되는 장르·무드 키워드 조합
`

export default async function handler(req) {
  // CORS 헤더
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const { moodText, userId } = await req.json()

    if (!moodText || typeof moodText !== 'string' || moodText.length > 500) {
      return new Response(JSON.stringify({ error: 'Invalid moodText' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Claude API 호출 (서버사이드 키 사용)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: moodText }],
      }),
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.content[0]?.text || '{}'
    const result = JSON.parse(text.replace(/```json|```/g, '').trim())

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Curate API error:', err)

    // Fallback 응답
    return new Response(JSON.stringify({
      planetIndex: 0,
      mood: '새벽 감성',
      description: '당신의 감성을 읽었습니다. 어울리는 행성으로 안내해드릴게요.',
      keywords: ['감성', '음악', '탐험'],
      searchQuery: 'lofi chill ambient',
      energy: 0.3,
      fallback: true,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
