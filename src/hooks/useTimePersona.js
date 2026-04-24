import { useEffect, useState } from 'react';
import { getLanguagePack } from '@config/stellara';

function getPeriodByHour(hour) {
  if (hour >= 4 && hour < 11) return 'dawn';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function pickPersona(previous, language) {
  const pack = getLanguagePack(language);
  const period = getPeriodByHour(new Date().getHours());
  const personas = pack.timePersonas;
  const headlines = pack.heroHeadlines;
  const persona = personas[period] ?? personas.night;
  const sloganCandidates = previous?.period === period
    ? persona.slogans.filter((slogan) => slogan !== previous.slogan)
    : persona.slogans;
  const sloganPool = sloganCandidates.length ? sloganCandidates : persona.slogans;
  const slogan = sloganPool[Math.floor(Math.random() * sloganPool.length)];
  const headlineCandidates = headlines.filter(
    (headline) => headline.accent !== previous?.headline?.accent
  );
  const headlinePool = headlineCandidates.length ? headlineCandidates : headlines;
  const headline = headlinePool[Math.floor(Math.random() * headlinePool.length)];

  return {
    period,
    ...persona,
    headline,
    slogan,
    signal: (previous?.signal ?? 0) + 1,
  };
}

export function useTimePersona(language = 'ko') {
  const [persona, setPersona] = useState(() => pickPersona(undefined, language));

  useEffect(() => {
    setPersona((prev) => pickPersona(prev, language));
  }, [language]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPersona((prev) => pickPersona(prev, language));
    }, 12 * 1000);

    return () => window.clearInterval(timer);
  }, [language]);

  return persona;
}
