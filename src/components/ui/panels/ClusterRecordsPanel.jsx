import React from 'react';
import { getLanguagePack, getLocalizedPlanet } from '@config/stellara';
import { getPlanetStyle } from '@utils/planetStyles';
import {
  MiniButton,
  panelDescriptionStyle,
  panelKickerStyle,
  panelTitleStyle,
} from './panelStyles';

const FILTER_KEYS = ['all', 'user', 'wander', 'featured'];

export function ClusterRecordsPanel({ planets, filtered, filterKey, setFilterKey, onGoPlanet, language = 'ko' }) {
  const pack = getLanguagePack(language);
  const copy = pack.panels.records;

  return (
    <div style={{ animation: 'fadeUp .28s ease both' }}>
      <div style={panelKickerStyle}>{copy.kicker}</div>
      <h2 style={panelTitleStyle}>{copy.title}</h2>
      <p style={panelDescriptionStyle}>{copy.description}</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '22px 0 16px' }}>
        {FILTER_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setFilterKey(key)}
            style={{
              padding: '7px 13px',
              borderRadius: 999,
              background: filterKey === key ? 'rgba(83,74,183,.46)' : 'rgba(14,10,44,.55)',
              border: `1px solid ${filterKey === key ? 'rgba(155,145,255,.52)' : 'rgba(123,112,224,.14)'}`,
              color: filterKey === key ? '#F0EEFF' : 'rgba(196,189,255,.48)',
              cursor: 'pointer',
              fontSize: 11,
              fontFamily: 'inherit',
            }}
          >
            {copy.filters[key]}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!filtered.length && (
          <div style={{ textAlign: 'center', padding: 34, color: 'rgba(196,189,255,.38)', fontSize: 13 }}>
            {copy.empty}
          </div>
        )}
        {filtered.map((planet) => {
          const displayPlanet = getLocalizedPlanet(planet, language);
          const planetStyle = getPlanetStyle(planet.index ?? 0);
          return (
            <button
              key={planet.planetId}
              onClick={() => onGoPlanet(planet)}
              style={{
                display: 'grid',
                gridTemplateColumns: '16px 1fr auto',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '13px 14px',
                background: 'rgba(8,6,24,.66)',
                border: '1px solid rgba(123,112,224,.13)',
                borderRadius: 16,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: planetStyle.hex,
                  boxShadow: `0 0 12px ${planetStyle.hex}`,
                }}
              />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', color: '#F0EEFF', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayPlanet.name}
                </span>
                <span style={{ display: 'block', color: 'rgba(155,145,255,.42)', fontSize: 11, marginTop: 3 }}>
                  {planet.type === 'user' ? copy.userType : planet.type === 'wandering' ? copy.wanderingType : copy.featuredType} · {(planet.tracks ?? []).length} {copy.tracks} · {displayPlanet.mood ?? planet.genre}
                </span>
              </span>
              <MiniButton>{copy.land}</MiniButton>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 14, fontSize: 11, color: 'rgba(155,145,255,.34)' }}>
        {copy.totalOrbit}: {planets.length}{copy.countSuffix}
      </div>
    </div>
  );
}
