export const panelTitleStyle = {
  fontSize: 28,
  fontWeight: 300,
  color: '#FBF8FF',
  letterSpacing: '-.03em',
  marginBottom: 8,
};

export const panelKickerStyle = {
  fontSize: 10,
  letterSpacing: '.22em',
  textTransform: 'uppercase',
  color: 'rgba(214,206,255,.78)',
  marginBottom: 10,
};

export const panelDescriptionStyle = {
  fontSize: 13,
  color: 'rgba(236,231,255,.86)',
  lineHeight: 1.8,
};

export const cardStyle = {
  background: 'rgba(8,6,24,.66)',
  border: '1px solid rgba(123,112,224,.13)',
  borderRadius: 18,
};

export function MetricCard({ label, value, detail }) {
  return (
    <div style={{ ...cardStyle, padding: '16px 14px' }}>
      <div style={{ fontSize: 28, fontWeight: 300, color: '#FBF8FF' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'rgba(214,206,255,.78)', letterSpacing: '.09em', marginTop: 4 }}>
        {label}
      </div>
      {detail && (
        <div style={{ fontSize: 11, color: 'rgba(233,228,255,.74)', lineHeight: 1.5, marginTop: 8 }}>
          {detail}
        </div>
      )}
    </div>
  );
}

export function StatusRow({ tone = 'dim', label, value, action }) {
  const colors = {
    green: '#44FF88',
    red: '#FF6B6B',
    gold: '#FFD166',
    blue: '#8EA7FF',
    dim: 'rgba(178,170,255,.68)',
  };

  return (
    <div
      style={{
        ...cardStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        padding: '13px 14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: colors[tone] ?? colors.dim,
            boxShadow: tone === 'green' || tone === 'gold' ? `0 0 8px ${colors[tone]}` : 'none',
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, color: 'rgba(233,228,255,.84)', letterSpacing: '.05em' }}>{label}</div>
          <div style={{ fontSize: 13, color: '#FBF8FF', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value}
          </div>
        </div>
      </div>
      {action}
    </div>
  );
}

export function MiniButton({ children, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '7px 12px',
        borderRadius: 999,
        background: disabled ? 'rgba(40,34,70,.35)' : 'rgba(83,74,183,.34)',
        border: '1px solid rgba(155,145,255,.24)',
        color: disabled ? 'rgba(220,214,255,.42)' : '#E8E1FF',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 11,
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}
