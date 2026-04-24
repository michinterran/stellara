import React from 'react';
import { AdminService } from '@services/AdminService';
import { createDefaultFeaturedGalaxy } from '@services/SocialGalaxyService';
import {
  MetricCard,
  MiniButton,
  StatusRow,
  cardStyle,
  panelDescriptionStyle,
  panelKickerStyle,
  panelTitleStyle,
} from './panels/panelStyles';
import { PlanetOrbitPreview } from './PlanetAppearanceStudio';

const TABS = [
  { id: 'overview', label: { ko: '개요', en: 'Overview' } },
  { id: 'galaxy', label: { ko: 'Galaxy Ops', en: 'Galaxy Ops' } },
  { id: 'admins', label: { ko: '관리자', en: 'Admins' } },
  { id: 'notices', label: { ko: '공지', en: 'Notices' } },
  { id: 'content', label: { ko: '문서', en: 'Content' } },
  { id: 'settings', label: { ko: '설정', en: 'Settings' } },
  { id: 'audit', label: { ko: '기록', en: 'Audit' } },
  { id: 'errors', label: { ko: '에러 센터', en: 'Errors' } },
  { id: 'finance', label: { ko: '재무', en: 'Finance' } },
  { id: 'api', label: { ko: 'API Usage', en: 'API Usage' } },
];

function getCopy(language = 'ko') {
  return language === 'en'
    ? {
        kicker: 'Universe Console',
        title: 'Super Admin Command Center',
        description: 'Manage live service health, promotions, notices, admins, and system status from one orbit.',
        close: 'Close',
        refresh: 'Refresh',
        sections: {
          overview: 'Live service health, growth, and revenue',
          galaxy: 'Promotions, galaxy metadata, and design',
          admins: 'Admin approval, roles, and permissions',
          notices: 'Signals, popups, and warp routes',
          content: 'Policies, docs, and public text',
          settings: 'System monitoring and operational controls',
          audit: 'Why a change happened and who changed it',
          errors: 'Service errors, status, and handling flow',
          finance: 'Payments, products, and revenue',
          api: 'Connected APIs, usage, and health status',
        },
        noAccess: 'This console is visible only to approved administrators.',
      }
    : {
        kicker: 'Universe Console',
        title: 'Super Admin Command Center',
        description: 'Stellara 우주 전체 운영, 프로모션, 공지, 관리자, 시스템 상태를 하나의 궤도에서 관리합니다.',
        close: '닫기',
        refresh: '새로고침',
        sections: {
          overview: '전체 서비스 현황, 성장, 매출',
          galaxy: '프로모션 은하 정보와 디자인 관리',
          admins: '관리자 승인, 역할, 권한 관리',
          notices: '신호, 팝업, 워프 연결 관리',
          content: '정책, 문서, 공개 텍스트 관리',
          settings: '시스템 모니터링과 운영 제어',
          audit: '누가 왜 변경했는지 기록',
          errors: '서비스 에러와 처리 상태 관리',
          finance: '결제, 상품, 매출 관리',
          api: '연결 API 상태와 사용량 관리',
        },
        noAccess: '이 콘솔은 승인된 관리자에게만 노출됩니다.',
      };
}

function pickCurrency(value = 0, language = 'ko') {
  return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'ko-KR', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function toneForStatus(status = '') {
  if (status === 'active' || status === 'healthy') return 'green';
  if (status === 'draft' || status === 'pending' || status === 'unknown') return 'gold';
  if (status === 'paused' || status === 'degraded') return 'red';
  return 'dim';
}

function normalizeOperationalStatus(status = 'unknown') {
  const value = String(status || 'unknown').toLowerCase();
  if (['active', 'healthy', 'resolved', 'paid'].includes(value)) return 'healthy';
  if (['draft', 'pending', 'unknown'].includes(value)) return 'unknown';
  if (['paused', 'degraded', 'deleted', 'failed', 'critical', 'error'].includes(value)) return 'degraded';
  return value;
}

function deriveApiHealth(label, card = {}, settings = {}) {
  const normalizedLabel = String(label || '').toLowerCase();
  if (normalizedLabel === 'youtube') {
    return normalizeOperationalStatus(settings?.monitoredYoutubeStatus || settings?.youtubeApiStatus || 'unknown');
  }

  const errors = Number(card.errors || 0);
  const remainingQuota = Number(card.remainingQuota ?? 0);
  const warningThreshold = Number(card.warningThreshold ?? 0);
  const requests = Number(card.requests || 0);

  if (errors > 0) return 'degraded';
  if (remainingQuota > 0 && warningThreshold > 0 && remainingQuota <= warningThreshold) return 'degraded';
  if (requests > 0) return 'healthy';
  return 'unknown';
}

function formatProviderLabel(label = '') {
  const normalized = String(label || '').trim();
  if (!normalized) return 'Unknown API';
  const aliases = {
    ai_api: 'AI API',
    youtube: 'YouTube API',
  };
  if (aliases[normalized]) return aliases[normalized];
  return normalized
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function defaultFeaturedDraft() {
  return createDefaultFeaturedGalaxy();
}

export function CommandCenterModal({
  open,
  language = 'ko',
  access,
  user,
  snapshot,
  loading = false,
  savingKey = null,
  onClose,
  onRefresh,
  onSaveFeaturedGalaxy,
  onSaveAdminUser,
  onSaveNotice,
  onDeleteNotice,
  onSaveDocument,
  onSaveSettings,
  onSavePayment,
  onSaveApiUsage,
  onSaveErrorLog,
}) {
  const copy = getCopy(language);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [featuredDraft, setFeaturedDraft] = React.useState(defaultFeaturedDraft);
  const [noticeDraft, setNoticeDraft] = React.useState(() => AdminService.getDefaultNotice(language));
  const [documentDraft, setDocumentDraft] = React.useState(() => AdminService.getDefaultDocument(language));
  const [settingsDraft, setSettingsDraft] = React.useState(() => AdminService.getDefaultSettings());
  const [paymentDraft, setPaymentDraft] = React.useState(() => AdminService.getDefaultPayment());
  const [apiUsageDraft, setApiUsageDraft] = React.useState(() => AdminService.getDefaultApiUsage());
  const [errorDraft, setErrorDraft] = React.useState(() => AdminService.getDefaultErrorLog());
  const [adminDraft, setAdminDraft] = React.useState({
    uid: '',
    email: '',
    displayName: '',
    role: 'viewer',
    status: 'pending',
    scopes: [],
  });
  const [commandDeskInput, setCommandDeskInput] = React.useState('');
  const [commandDeskResponse, setCommandDeskResponse] = React.useState(() => AdminService.generateCommandDeskResponse({}, '', language));

  React.useEffect(() => {
    setNoticeDraft(AdminService.getDefaultNotice(language));
    setDocumentDraft(AdminService.getDefaultDocument(language));
    setCommandDeskResponse(AdminService.generateCommandDeskResponse(snapshot || {}, '', language));
  }, [language]);

  React.useEffect(() => {
    setCommandDeskResponse(AdminService.generateCommandDeskResponse(snapshot || {}, commandDeskInput, language));
  }, [commandDeskInput, language, snapshot]);

  React.useEffect(() => {
    setPaymentDraft(AdminService.getDefaultPayment());
    setApiUsageDraft(AdminService.getDefaultApiUsage());
    setErrorDraft(AdminService.getDefaultErrorLog());
  }, []);

  React.useEffect(() => {
    if (!snapshot?.settings) return;
    setSettingsDraft({
      ...AdminService.getDefaultSettings(),
      ...snapshot.settings,
      limits: {
        ...AdminService.getDefaultSettings().limits,
        ...(snapshot.settings?.limits ?? {}),
      },
    });
  }, [snapshot?.settings]);

  const visibleTabs = React.useMemo(
    () => TABS.filter((tab) => AdminService.canAccessSection(access, tab.id)),
    [access]
  );

  React.useEffect(() => {
    if (!visibleTabs.length) return;
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [activeTab, visibleTabs]);

  if (!open) return null;
  if (!access?.isApprovedAdmin) {
    return (
      <ModalShell onClose={onClose}>
        <Header copy={copy} onClose={onClose} onRefresh={onRefresh} loading={loading} />
        <div style={{ padding: 32, color: '#F0EEFF' }}>{copy.noAccess}</div>
      </ModalShell>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewSection snapshot={snapshot} language={language} onJumpToSection={setActiveTab} visibleSections={visibleTabs.map((tab) => tab.id)} commandDeskInput={commandDeskInput} setCommandDeskInput={setCommandDeskInput} commandDeskResponse={commandDeskResponse} />;
      case 'galaxy':
        return (
          <GalaxyOpsSection
            language={language}
            featuredGalaxies={snapshot?.featuredGalaxies ?? []}
            featuredDraft={featuredDraft}
            setFeaturedDraft={setFeaturedDraft}
            onSave={onSaveFeaturedGalaxy}
            saving={savingKey === 'featured-galaxy'}
          />
        );
      case 'admins':
        return (
          <AdminsSection
            language={language}
            adminUsers={snapshot?.adminUsers ?? []}
            users={snapshot?.users ?? []}
            draft={adminDraft}
            setDraft={setAdminDraft}
            onSave={onSaveAdminUser}
            saving={savingKey === 'admin-user'}
          />
        );
      case 'notices':
        return (
          <NoticesSection
            language={language}
            notices={snapshot?.notices ?? []}
            draft={noticeDraft}
            setDraft={setNoticeDraft}
            onSave={onSaveNotice}
            onDelete={onDeleteNotice}
            saving={savingKey === 'notice'}
          />
        );
      case 'content':
        return (
          <ContentSection
            language={language}
            documents={snapshot?.documents ?? []}
            draft={documentDraft}
            setDraft={setDocumentDraft}
            onSave={onSaveDocument}
            saving={savingKey === 'document'}
          />
        );
      case 'settings':
        return (
          <SettingsSection
            language={language}
            draft={settingsDraft}
            setDraft={setSettingsDraft}
            onSave={onSaveSettings}
            saving={savingKey === 'settings'}
          />
        );
      case 'audit':
        return <AuditSection language={language} auditLogs={snapshot?.auditLogs ?? []} />;
      case 'errors':
        return <ErrorsSection language={language} errors={snapshot?.errors ?? []} draft={errorDraft} setDraft={setErrorDraft} onSave={onSaveErrorLog} saving={savingKey === 'error-log'} />;
      case 'finance':
        return <FinanceSection language={language} payments={snapshot?.payments ?? []} overview={snapshot?.overview} draft={paymentDraft} setDraft={setPaymentDraft} onSave={onSavePayment} saving={savingKey === 'payment'} />;
      case 'api':
        return <ApiUsageSection language={language} apiUsage={snapshot?.apiUsage ?? []} overview={snapshot?.overview} settings={snapshot?.settings} draft={apiUsageDraft} setDraft={setApiUsageDraft} onSave={onSaveApiUsage} saving={savingKey === 'api-usage'} />;
      default:
        return null;
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <Header copy={copy} onClose={onClose} onRefresh={onRefresh} loading={loading} />
      <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr)', height: 'calc(100vh - 120px)', minHeight: 0 }}>
        <aside style={{ borderRight: '1px solid rgba(123,112,224,.14)', padding: 18, overflowY: 'auto' }}>
          <div style={{ ...cardStyle, padding: 16, marginBottom: 14, background: 'linear-gradient(180deg, rgba(55,24,6,.9), rgba(31,14,6,.88))', border: '1px solid rgba(244,151,44,.28)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(255,204,142,.42)' }} />
              ) : (
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(244,151,44,.18)', border: '1px solid rgba(244,151,44,.32)' }} />
              )}
              <div>
                <div style={{ fontSize: 12, color: '#FFF5EA' }}>{access.displayName || access.email || 'Admin'}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,214,168,.76)', marginTop: 6 }}>{access.role}</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: `1px solid ${activeTab === tab.id ? 'rgba(155,145,255,.42)' : 'rgba(123,112,224,.12)'}`,
                  background: activeTab === tab.id ? 'rgba(83,74,183,.24)' : 'rgba(8,6,24,.55)',
                  color: activeTab === tab.id ? '#F0EEFF' : 'rgba(220,214,255,.72)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                  <div style={{ fontSize: 12 }}>{tab.label?.[language] || tab.label?.ko || tab.id}</div>
                <div style={{ fontSize: 10, color: 'rgba(214,209,255,.56)', lineHeight: 1.5, marginTop: 4 }}>
                  {copy.sections[tab.id]}
                </div>
              </button>
            ))}
          </div>
        </aside>
        <section style={{ padding: 24, paddingBottom: 72, overflowY: 'auto', minHeight: 0 }}>
          <div style={{ paddingBottom: 80 }}>
            {renderActiveTab()}
          </div>
        </section>
      </div>
    </ModalShell>
  );
}

function ModalShell({ children, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 460,
        background: 'rgba(2,1,10,.74)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0 }}
      />
      <div
        style={{
          position: 'relative',
          margin: '28px',
          height: 'calc(100vh - 56px)',
          borderRadius: 28,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(7,5,20,.98), rgba(4,3,16,.98))',
          border: '1px solid rgba(123,112,224,.18)',
          boxShadow: '0 40px 120px rgba(0,0,0,.48)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Header({ copy, onClose, onRefresh, loading }) {
  return (
    <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid rgba(123,112,224,.14)', display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start' }}>
      <div>
        <div style={panelKickerStyle}>{copy.kicker}</div>
        <div style={panelTitleStyle}>{copy.title}</div>
        <div style={{ ...panelDescriptionStyle, maxWidth: 780 }}>{copy.description}</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <MiniButton disabled={loading} onClick={onRefresh}>{copy.refresh}</MiniButton>
        <MiniButton onClick={onClose}>{copy.close}</MiniButton>
      </div>
    </div>
  );
}

function SectionHeader({ kicker, title, description }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={panelKickerStyle}>{kicker}</div>
      <div style={{ ...panelTitleStyle, fontSize: 24 }}>{title}</div>
      <div style={panelDescriptionStyle}>{description}</div>
    </div>
  );
}

function OverviewSection({ snapshot, language, onJumpToSection, visibleSections = [], commandDeskInput, setCommandDeskInput, commandDeskResponse }) {
  const overview = snapshot?.overview;
  const totals = overview?.totals ?? {};
  const actionItems = (overview?.actionItems || []).filter((item) => visibleSections.includes(item.section));
  return (
    <div>
      <SectionHeader
        kicker="Overview"
        title={language === 'en' ? 'Universe Health' : '우주 운영 현황'}
        description={language === 'en'
          ? 'A top-level operating pulse for users, promotions, notices, revenue, and system health.'
          : '유저, 프로모션, 공지, 매출, 시스템 상태를 한 번에 보는 상위 운영 현황입니다.'}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
        <MetricCard label="Total Users" value={totals.totalUsers ?? 0} />
        <MetricCard label="Public Galaxies" value={totals.publicGalaxies ?? 0} />
        <MetricCard label="Featured Galaxies" value={totals.featuredGalaxies ?? 0} />
        <MetricCard label="Approved Admins" value={totals.approvedAdmins ?? 0} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 14, marginTop: 14 }}>
        <div style={{ ...cardStyle, padding: 18 }}>
          <div style={{ fontSize: 14, color: '#F0EEFF', marginBottom: 12 }}>
            {language === 'en' ? 'Revenue Pulse' : '매출 펄스'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10 }}>
            <MetricCard label="Today" value={pickCurrency(overview?.revenue?.today, language)} />
            <MetricCard label="Week" value={pickCurrency(overview?.revenue?.week, language)} />
            <MetricCard label="Month" value={pickCurrency(overview?.revenue?.month, language)} />
            <MetricCard label="Year" value={pickCurrency(overview?.revenue?.year, language)} />
            <MetricCard label="All" value={pickCurrency(overview?.revenue?.all, language)} />
          </div>
          <div style={{ marginTop: 16 }}>
            <MiniChart data={overview?.trends?.revenue ?? []} accent="#FFD166" />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <StatusRow tone={toneForStatus(overview?.apiStatus?.firebase)} label="Firebase" value={overview?.apiStatus?.firebase || 'unknown'} />
          <StatusRow tone={toneForStatus(overview?.apiStatus?.youtube)} label="YouTube API" value={overview?.apiStatus?.youtube || 'unknown'} />
          <StatusRow tone="gold" label={language === 'en' ? 'Active Promotions' : '운영 중 프로모션'} value={String(totals.activePromotions ?? 0)} />
          <StatusRow tone="blue" label={language === 'en' ? 'Live Notices' : '활성 공지'} value={`${totals.activeNotices ?? 0} / ${totals.activePopups ?? 0}`} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div style={{ ...cardStyle, padding: 18 }}>
          <div style={{ fontSize: 14, color: '#F0EEFF', marginBottom: 10 }}>
            {language === 'en' ? 'User Growth' : '유저 증가 추이'}
          </div>
          <MiniChart data={overview?.trends?.userGrowth ?? []} accent="#8EA7FF" />
        </div>
        <div style={{ ...cardStyle, padding: 18 }}>
          <div style={{ fontSize: 14, color: '#F0EEFF', marginBottom: 10 }}>
            {language === 'en' ? 'API Load' : 'API 사용량 추이'}
          </div>
          <MiniChart data={overview?.trends?.apiUsage ?? []} accent="#71C7D8" />
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ ...cardStyle, padding: 18 }}>
          <div style={{ fontSize: 14, color: '#F0EEFF', marginBottom: 12 }}>
            {language === 'en' ? 'Action Required' : '지금 처리할 운영 액션'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            {(actionItems.length ? actionItems : [{
              id: 'stable',
              title: language === 'en' ? 'Universe is stable' : '우주 상태가 안정적입니다',
              detail: language === 'en' ? 'No urgent operator action is currently highlighted.' : '지금 바로 처리할 긴급 운영 항목은 없습니다.',
              tone: 'green',
              section: 'overview',
            }]).map((item) => (
              <ActionCard key={item.id} item={item} language={language} onClick={() => onJumpToSection?.(item.section)} />
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ ...cardStyle, padding: 18 }}>
          <div style={{ fontSize: 14, color: '#F0EEFF', marginBottom: 8 }}>
            {language === 'en' ? 'AI Command Desk' : 'AI 커맨드 데스크'}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(220,214,255,.72)', lineHeight: 1.7 }}>
            {language === 'en'
              ? 'Ask about revenue, active promotions, notices, pending admins, API pressure, or open errors.'
              : '매출, 활성 프로모션, 공지, 승인 대기 관리자, API 압박, 미해결 에러 등에 대해 자연어로 물어보세요.'}
          </div>
          <FieldHint>
            {language === 'en'
              ? 'Until an external LLM is connected, this desk answers from the current Command Center snapshot and recent records only.'
              : '외부 LLM이 연결되기 전까지는, 이 데스크가 현재 Command Center 스냅샷과 최근 기록만 기준으로 답합니다.'}
          </FieldHint>
          <FieldTextarea rows={3} value={commandDeskInput} onChange={(event) => setCommandDeskInput?.(event.target.value)} placeholder={language === 'en' ? 'Example: summarize today’s operations and tell me what needs attention.' : '예: 오늘 운영 상황을 요약하고 지금 가장 먼저 봐야 할 걸 알려줘.'} />
          <div style={{ ...cardStyle, padding: 14, marginTop: 12, background: 'rgba(9,7,28,.82)' }}>
            <div style={{ fontSize: 10, color: 'rgba(178,170,255,.62)', letterSpacing: '.14em', textTransform: 'uppercase' }}>
              {language === 'en' ? 'Response' : '응답'}
            </div>
            <div style={{ fontSize: 13, color: '#F0EEFF', lineHeight: 1.75, marginTop: 10 }}>
              {commandDeskResponse}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GalaxyOpsSection({ language, featuredGalaxies, featuredDraft, setFeaturedDraft, onSave, saving }) {
  const isEditing = Boolean(featuredDraft.id && featuredGalaxies.some((item) => item.id === featuredDraft.id));
  return (
    <div>
      <SectionHeader
        kicker="Galaxy Ops"
        title={language === 'en' ? 'Promoted Cosmos' : '프로모션 우주 운영'}
        description={language === 'en'
          ? 'Create and update promoted galaxies, tune design presets, and control campaign visibility.'
          : '프로모션 은하를 만들고 수정하며, 디자인 프리셋과 캠페인 노출 상태를 운영합니다.'}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 14 }}>
        <div style={{ ...cardStyle, padding: 18 }}>
          <div style={{ fontSize: 14, color: '#F0EEFF', marginBottom: 12 }}>
            {language === 'en' ? 'Promotion Draft' : '프로모션 초안'}
          </div>
          <FieldLabel>ID</FieldLabel>
          <FieldInput value={featuredDraft.id} onChange={(event) => setFeaturedDraft((prev) => ({ ...prev, id: event.target.value }))} placeholder="brand_afterglow_radio" />
          <FieldHint>{language === 'en' ? 'Internal document ID. Keep it short and stable.' : '내부 문서 ID입니다. 짧고 고정된 값으로 유지하세요.'}</FieldHint>
          <FieldLabel>Slug</FieldLabel>
          <FieldInput value={featuredDraft.slug} onChange={(event) => setFeaturedDraft((prev) => ({ ...prev, slug: event.target.value }))} placeholder="afterglow-radio" />
          <FieldHint>{language === 'en' ? 'Public route text used in URLs and routing.' : '공개 주소와 라우팅에 쓰이는 텍스트입니다.'}</FieldHint>
          <TwoCol>
            <div>
              <FieldLabel>{language === 'en' ? 'Title' : '제목'}</FieldLabel>
              <FieldInput value={featuredDraft.title} onChange={(event) => setFeaturedDraft((prev) => ({ ...prev, title: event.target.value }))} />
            </div>
            <div>
              <FieldLabel>{language === 'en' ? 'Status' : '상태'}</FieldLabel>
              <FieldSelect value={featuredDraft.status} onChange={(event) => setFeaturedDraft((prev) => ({ ...prev, status: event.target.value }))}>
                {['draft', 'active', 'paused', 'ended'].map((value) => <option key={value} value={value}>{value}</option>)}
              </FieldSelect>
            </div>
          </TwoCol>
          <TwoCol>
            <div>
              <FieldLabel>{language === 'en' ? 'Promotion Type' : '프로모션 타입'}</FieldLabel>
              <FieldSelect value={featuredDraft.promotionType} onChange={(event) => setFeaturedDraft((prev) => ({ ...prev, promotionType: event.target.value }))}>
                {['brand', 'campaign', 'label'].map((value) => <option key={value} value={value}>{value}</option>)}
              </FieldSelect>
            </div>
            <div>
              <FieldLabel>{language === 'en' ? 'Featured Order' : '노출 순서'}</FieldLabel>
              <FieldInput type="number" value={featuredDraft.featuredOrder} onChange={(event) => setFeaturedDraft((prev) => ({ ...prev, featuredOrder: Number(event.target.value || 0) }))} />
            </div>
          </TwoCol>
          <TwoCol>
            <div>
              <FieldLabel>{language === 'en' ? 'Approval' : '승인 상태'}</FieldLabel>
              <FieldSelect value={featuredDraft.approvalStatus || 'curation_review'} onChange={(event) => setFeaturedDraft((prev) => ({ ...prev, approvalStatus: event.target.value }))}>
                {['curation_review', 'fast_track', 'approved', 'rejected'].map((value) => <option key={value} value={value}>{value}</option>)}
              </FieldSelect>
            </div>
            <div>
              <FieldLabel>{language === 'en' ? 'Package' : '상품 패키지'}</FieldLabel>
              <FieldInput value={featuredDraft.packageName || ''} onChange={(event) => setFeaturedDraft((prev) => ({ ...prev, packageName: event.target.value }))} />
            </div>
          </TwoCol>
          <FieldLabel>{language === 'en' ? 'Recommended Duration (days)' : '권장 운영 기간(일)'}</FieldLabel>
          <FieldInput type="number" value={featuredDraft.recommendedDurationDays || 30} onChange={(event) => setFeaturedDraft((prev) => ({ ...prev, recommendedDurationDays: Number(event.target.value || 0) }))} />
          <TwoCol>
            <div>
              <FieldLabel>{language === 'en' ? 'Starts At' : '시작 시각'}</FieldLabel>
              <FieldInput type="datetime-local" value={toDateTimeLocalValue(featuredDraft.startsAt)} onChange={(event) => setFeaturedDraft((prev) => ({ ...prev, startsAt: fromDateTimeLocalValue(event.target.value) }))} />
            </div>
            <div>
              <FieldLabel>{language === 'en' ? 'Ends At' : '종료 시각'}</FieldLabel>
              <FieldInput type="datetime-local" value={toDateTimeLocalValue(featuredDraft.endsAt)} onChange={(event) => setFeaturedDraft((prev) => ({ ...prev, endsAt: fromDateTimeLocalValue(event.target.value) }))} />
            </div>
          </TwoCol>
          <FieldLabel>{language === 'en' ? 'Promoted By' : '운영 주체'}</FieldLabel>
          <FieldInput value={featuredDraft.promotedBy} onChange={(event) => setFeaturedDraft((prev) => ({ ...prev, promotedBy: event.target.value }))} />
          <FieldLabel>{language === 'en' ? 'Owner Label' : '소유자 라벨'}</FieldLabel>
          <FieldInput value={featuredDraft.ownerLabel} onChange={(event) => setFeaturedDraft((prev) => ({ ...prev, ownerLabel: event.target.value }))} />
          <FieldHint>{language === 'en' ? 'The operator name users see on the galaxy card.' : '사용자가 은하 카드에서 보게 되는 운영 주체 이름입니다.'}</FieldHint>
          <FieldLabel>{language === 'en' ? 'Spotlight' : '스포트라이트 문장'}</FieldLabel>
          <FieldTextarea value={featuredDraft.spotlightText} onChange={(event) => setFeaturedDraft((prev) => ({ ...prev, spotlightText: event.target.value }))} />
          <FieldHint>{language === 'en' ? 'A short sentence that appears on cards and signals when this galaxy is highlighted.' : '이 은하가 노출될 때 카드와 신호에서 짧게 보이는 문장입니다.'}</FieldHint>
          <FieldLabel>{language === 'en' ? 'Description' : '설명'}</FieldLabel>
          <FieldTextarea value={featuredDraft.description} onChange={(event) => setFeaturedDraft((prev) => ({ ...prev, description: event.target.value }))} />
          <TwoCol>
            <div>
              <FieldLabel>Tags</FieldLabel>
              <FieldInput value={(featuredDraft.tags || []).join(', ')} onChange={(event) => setFeaturedDraft((prev) => ({ ...prev, tags: splitCsv(event.target.value) }))} />
            </div>
            <div>
              <FieldLabel>{language === 'en' ? 'Audience Signals' : '대상 신호'}</FieldLabel>
              <FieldInput value={(featuredDraft.audienceSignals || []).join(', ')} onChange={(event) => setFeaturedDraft((prev) => ({ ...prev, audienceSignals: splitCsv(event.target.value) }))} />
              <FieldHint>{language === 'en' ? 'Mood, genre, artist, or scene hints matched to this promotion.' : '이 프로모션과 연결할 무드, 장르, 아티스트, 씬 신호입니다.'}</FieldHint>
            </div>
          </TwoCol>
          <DesignEditor draft={featuredDraft} setDraft={setFeaturedDraft} language={language} />
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <MiniButton disabled={saving} onClick={() => onSave?.(featuredDraft)}>
              {saving ? (language === 'en' ? 'Saving...' : '저장 중...') : isEditing ? (language === 'en' ? 'Update Galaxy' : '은하 수정') : (language === 'en' ? 'Save Galaxy' : '은하 저장')}
            </MiniButton>
            <MiniButton onClick={() => setFeaturedDraft(defaultFeaturedDraft())}>
              {language === 'en' ? 'Reset Draft' : '초안 초기화'}
            </MiniButton>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(featuredGalaxies || []).map((galaxy) => (
            <div key={galaxy.id} style={{ ...cardStyle, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ color: '#F0EEFF' }}>{galaxy.title}</div>
                <span style={{ fontSize: 10, color: 'rgba(220,214,255,.66)' }}>{galaxy.status}</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(214,209,255,.66)', lineHeight: 1.6, marginTop: 6 }}>
                {galaxy.promotedBy || galaxy.ownerLabel} · {galaxy.design?.theme || 'luxury'} · {galaxy.design?.scaleTier || 'hero'} · {galaxy.packageName || 'package'}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <MiniButton onClick={() => setFeaturedDraft({ ...defaultFeaturedDraft(), ...galaxy })}>
                  {language === 'en' ? 'Load Draft' : '초안 불러오기'}
                </MiniButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminsSection({ language, adminUsers, users, draft, setDraft, onSave, saving }) {
  const roleDetails = AdminService.getRoleDetails();
  const isEditing = Boolean(draft.uid && adminUsers.some((item) => item.uid === draft.uid));
  return (
    <div>
      <SectionHeader
        kicker="Admins"
        title={language === 'en' ? 'Administrator Control' : '관리자 제어'}
        description={language === 'en'
          ? 'Approve operators, assign scoped roles, and keep a clear admin roster.'
          : '운영자를 승인하고 역할을 할당하며, 관리자 명단을 명확하게 유지합니다.'}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ ...cardStyle, padding: 18 }}>
          <div style={{ fontSize: 14, color: '#F0EEFF', marginBottom: 12 }}>
            {language === 'en' ? 'Grant Access' : '권한 부여'}
          </div>
          <FieldLabel>UID</FieldLabel>
          <FieldInput value={draft.uid} onChange={(event) => setDraft((prev) => ({ ...prev, uid: event.target.value }))} />
          <FieldHint>
            {language === 'en'
              ? 'If you only know the email, leave UID empty after the user has logged in at least once.'
              : '이메일만 알고 있다면, 대상 사용자가 한 번 로그인한 뒤 UID는 비워두고 저장해도 됩니다.'}
          </FieldHint>
          <FieldLabel>Email</FieldLabel>
          <FieldInput value={draft.email} onChange={(event) => setDraft((prev) => ({ ...prev, email: event.target.value }))} />
          <FieldLabel>{language === 'en' ? 'Display Name' : '표시 이름'}</FieldLabel>
          <FieldInput value={draft.displayName} onChange={(event) => setDraft((prev) => ({ ...prev, displayName: event.target.value }))} />
          <TwoCol>
            <div>
              <FieldLabel>{language === 'en' ? 'Role' : '역할'}</FieldLabel>
              <FieldSelect value={draft.role} onChange={(event) => setDraft((prev) => ({ ...prev, role: event.target.value }))}>
                {['super_admin', 'admin', 'editor', 'finance_manager', 'support_manager', 'viewer'].map((role) => <option key={role} value={role}>{role}</option>)}
              </FieldSelect>
              <FieldHint>{language === 'en' ? 'Choose the closest operational role first. In most cases, Admin is enough and Super Admin should stay rare.' : '먼저 가장 가까운 운영 역할을 고르세요. 대부분은 Admin이면 충분하고, Super Admin은 아주 제한적으로만 써야 합니다.'}</FieldHint>
            </div>
            <div>
              <FieldLabel>{language === 'en' ? 'Status' : '상태'}</FieldLabel>
              <FieldSelect value={draft.status} onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}>
                {['pending', 'active', 'suspended'].map((status) => <option key={status} value={status}>{status}</option>)}
              </FieldSelect>
              <FieldHint>{language === 'en' ? 'Set Active to approve this admin immediately. Pending keeps the account out of the console.' : '즉시 관리자 권한을 열려면 Active로 두세요. Pending은 아직 콘솔 접근이 열리지 않습니다.'}</FieldHint>
            </div>
          </TwoCol>
          <FieldLabel>Scopes</FieldLabel>
          <FieldInput value={(draft.scopes || []).join(', ')} onChange={(event) => setDraft((prev) => ({ ...prev, scopes: splitCsv(event.target.value) }))} placeholder="overview, galaxy_ops, finance" />
          <FieldHint>{language === 'en' ? 'Scopes are the actual section permissions. Leave the role preset unless you intentionally need a custom access mix.' : 'Scopes는 실제 메뉴 접근 권한입니다. 특별한 이유가 없다면 역할 프리셋을 그대로 두는 편이 안전합니다.'}</FieldHint>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <MiniButton disabled={saving} onClick={() => onSave?.(draft)}>
              {saving ? (language === 'en' ? 'Saving...' : '저장 중...') : isEditing ? (language === 'en' ? 'Update Admin' : '관리자 수정') : (language === 'en' ? 'Approve Admin' : '관리자 승인')}
            </MiniButton>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 18 }}>
            {Object.entries(roleDetails).map(([roleKey, roleMeta]) => (
              <button
                key={roleKey}
                type="button"
                onClick={() => setDraft((prev) => ({ ...prev, role: roleKey, scopes: roleMeta.scopes.includes('*') ? ['*'] : roleMeta.scopes }))}
                style={{
                  ...cardStyle,
                  padding: 12,
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: roleKey === draft.role ? '1px solid rgba(155,145,255,.38)' : '1px solid rgba(123,112,224,.12)',
                  background: roleKey === draft.role ? 'rgba(83,74,183,.16)' : 'rgba(8,6,24,.56)',
                }}
              >
                <div style={{ color: '#F0EEFF', fontSize: 12 }}>{roleMeta.label}</div>
                <div style={{ color: 'rgba(220,214,255,.72)', fontSize: 11, lineHeight: 1.6, marginTop: 6 }}>{roleMeta.description}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {adminUsers.map((adminUser) => (
            <div key={adminUser.uid} style={{ ...cardStyle, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ color: '#F0EEFF' }}>{adminUser.displayName || adminUser.email || adminUser.uid}</div>
                  <div style={{ fontSize: 11, color: 'rgba(214,209,255,.64)', marginTop: 4 }}>{adminUser.email || adminUser.uid}</div>
                </div>
                <span style={{ fontSize: 10, color: 'rgba(220,214,255,.66)' }}>{adminUser.role}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <MiniButton onClick={() => setDraft({ ...adminUser, scopes: adminUser.scopes || [] })}>
                  {language === 'en' ? 'Edit' : '수정'}
                </MiniButton>
              </div>
            </div>
          ))}
          <div style={{ ...cardStyle, padding: 14 }}>
            <div style={{ fontSize: 13, color: '#F0EEFF', marginBottom: 8 }}>
              {language === 'en' ? 'Recent Users' : '최근 사용자'}
            </div>
            {(users || []).slice(0, 10).map((user) => (
              <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(123,112,224,.08)' }}>
                <div style={{ fontSize: 12, color: 'rgba(220,214,255,.74)' }}>{user.displayName || user.email || user.id}</div>
                <MiniButton onClick={() => setDraft((prev) => ({ ...prev, uid: user.id, email: user.email || '', displayName: user.displayName || '' }))}>
                  {language === 'en' ? 'Use' : '가져오기'}
                </MiniButton>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NoticesSection({ language, notices, draft, setDraft, onSave, onDelete, saving }) {
  const isEditing = Boolean(draft.id && notices.some((item) => item.id === draft.id));
  return (
    <div>
      <SectionHeader kicker="Notices" title={language === 'en' ? 'Signal & Popup Manager' : '신호 & 팝업 관리자'} description={language === 'en' ? 'Manage bilingual signal text, popup exposure, placement, and warp targets.' : '한글/영문 신호 문구, 팝업 노출, 배치 위치, 워프 대상을 함께 관리합니다.'} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ ...cardStyle, padding: 18 }}>
          <FieldLabel>ID</FieldLabel>
          <FieldInput value={draft.id} onChange={(event) => setDraft((prev) => ({ ...prev, id: event.target.value }))} />
          <FieldLabel>{language === 'en' ? 'Korean Title' : '제목(한글)'}</FieldLabel>
          <FieldInput value={draft.title} onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))} />
          <FieldHint>{language === 'en' ? 'Shown first in Korean screens and used as the fallback title if no English copy is set.' : '한글 화면에서 먼저 보이며, 영문 문구가 없을 때 fallback 제목으로도 사용됩니다.'}</FieldHint>
          <FieldLabel>{language === 'en' ? 'English Title' : '제목(영문)'}</FieldLabel>
          <FieldInput value={draft.titleEn || ''} onChange={(event) => setDraft((prev) => ({ ...prev, titleEn: event.target.value }))} />
          <FieldLabel>{language === 'en' ? 'Korean Body' : '본문(한글)'}</FieldLabel>
          <FieldTextarea value={draft.body} onChange={(event) => setDraft((prev) => ({ ...prev, body: event.target.value }))} />
          <FieldHint>{language === 'en' ? 'Keep this short and event-focused. It will appear inside the live signal surface.' : '짧고 사건 중심으로 쓰는 편이 좋습니다. 실제 라이브 신호 표면에 바로 노출됩니다.'}</FieldHint>
          <FieldLabel>{language === 'en' ? 'English Body' : '본문(영문)'}</FieldLabel>
          <FieldTextarea value={draft.bodyEn || ''} onChange={(event) => setDraft((prev) => ({ ...prev, bodyEn: event.target.value }))} />
          <TwoCol>
            <div>
              <FieldLabel>{language === 'en' ? 'Tone' : '톤'}</FieldLabel>
              <FieldSelect value={draft.tone} onChange={(event) => setDraft((prev) => ({ ...prev, tone: event.target.value }))}>
                {['info', 'warning', 'campaign', 'emergency'].map((value) => <option key={value} value={value}>{value}</option>)}
              </FieldSelect>
            </div>
            <div>
              <FieldLabel>{language === 'en' ? 'Placement' : '배치'}</FieldLabel>
              <FieldSelect value={draft.placement} onChange={(event) => setDraft((prev) => ({ ...prev, placement: event.target.value }))}>
                {['rolling_signal', 'popup'].map((value) => <option key={value} value={value}>{value}</option>)}
              </FieldSelect>
            </div>
          </TwoCol>
          <TwoCol>
            <div>
              <FieldLabel>{language === 'en' ? 'CTA (Korean)' : '버튼 문구(한글)'}</FieldLabel>
              <FieldInput value={draft.ctaLabel || ''} onChange={(event) => setDraft((prev) => ({ ...prev, ctaLabel: event.target.value }))} />
            </div>
            <div>
              <FieldLabel>{language === 'en' ? 'CTA (English)' : '버튼 문구(영문)'}</FieldLabel>
              <FieldInput value={draft.ctaLabelEn || ''} onChange={(event) => setDraft((prev) => ({ ...prev, ctaLabelEn: event.target.value }))} />
            </div>
          </TwoCol>
          <TwoCol>
            <div>
              <FieldLabel>{language === 'en' ? 'Target Galaxy ID' : '대상 은하 ID'}</FieldLabel>
              <FieldInput value={draft.targetGalaxyId || ''} onChange={(event) => setDraft((prev) => ({ ...prev, targetGalaxyId: event.target.value }))} />
              <FieldHint>{language === 'en' ? 'The real Firestore document ID used for warp routing.' : '워프 연결에 쓰이는 실제 Firestore 문서 ID입니다.'}</FieldHint>
            </div>
            <div>
              <FieldLabel>{language === 'en' ? 'Target Galaxy Slug' : '대상 은하 슬러그'}</FieldLabel>
              <FieldInput value={draft.targetGalaxySlug || ''} onChange={(event) => setDraft((prev) => ({ ...prev, targetGalaxySlug: event.target.value }))} />
              <FieldHint>{language === 'en' ? 'Fallback route text used if the ID is missing or invalid.' : 'ID가 없거나 잘못됐을 때 fallback으로 쓰는 라우트 텍스트입니다.'}</FieldHint>
            </div>
          </TwoCol>
          <FieldLabel>{language === 'en' ? 'Status' : '상태'}</FieldLabel>
          <FieldSelect value={draft.status} onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}>
            {['draft', 'active', 'paused', 'ended'].map((value) => <option key={value} value={value}>{value}</option>)}
          </FieldSelect>
          <TwoCol>
            <div>
              <FieldLabel>{language === 'en' ? 'Starts At' : '시작 시각'}</FieldLabel>
              <FieldInput type="datetime-local" value={toDateTimeLocalValue(draft.startsAt)} onChange={(event) => setDraft((prev) => ({ ...prev, startsAt: fromDateTimeLocalValue(event.target.value) }))} />
            </div>
            <div>
              <FieldLabel>{language === 'en' ? 'Ends At' : '종료 시각'}</FieldLabel>
              <FieldInput type="datetime-local" value={toDateTimeLocalValue(draft.endsAt)} onChange={(event) => setDraft((prev) => ({ ...prev, endsAt: fromDateTimeLocalValue(event.target.value) }))} />
            </div>
          </TwoCol>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <MiniButton disabled={saving} onClick={() => onSave?.(draft)}>
              {saving ? (language === 'en' ? 'Saving...' : '저장 중...') : isEditing ? (language === 'en' ? 'Update Signal' : '수정 저장') : (language === 'en' ? 'Save Signal' : '신호 저장')}
            </MiniButton>
            <MiniButton onClick={() => setDraft(AdminService.getDefaultNotice(language))}>
              {language === 'en' ? 'Reset' : '초기화'}
            </MiniButton>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ ...cardStyle, padding: 14 }}>
            <div style={{ fontSize: 13, color: '#F0EEFF', marginBottom: 8 }}>
              {language === 'en' ? 'Issued IDs' : '발행된 ID 관리'}
            </div>
            {(notices || []).map((notice) => (
              <div key={`registry-${notice.id}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(123,112,224,.08)', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#F0EEFF' }}>{notice.id}</div>
                  <div style={{ fontSize: 10, color: 'rgba(178,170,255,.66)', marginTop: 4 }}>{notice.placement} · {notice.status}</div>
                </div>
                <MiniButton onClick={() => setDraft({ ...notice })}>{language === 'en' ? 'Load' : '불러오기'}</MiniButton>
                <MiniButton onClick={() => setDraft({ ...AdminService.getDefaultNotice(language), id: notice.id })}>{language === 'en' ? 'Reuse' : '재사용'}</MiniButton>
              </div>
            ))}
          </div>
          {notices.map((notice) => (
            <div key={notice.id} style={{ ...cardStyle, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ color: '#F0EEFF' }}>{language === 'en' ? (notice.titleEn || notice.title) : (notice.title || notice.titleEn)}</div>
                <span style={{ fontSize: 10, color: 'rgba(220,214,255,.66)' }}>{notice.status}</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(214,209,255,.68)', lineHeight: 1.6, marginTop: 6 }}>{language === 'en' ? (notice.bodyEn || notice.body) : (notice.body || notice.bodyEn)}</div>
              <div style={{ fontSize: 10, color: 'rgba(178,170,255,.66)', marginTop: 6 }}>
                {(notice.placement || 'rolling_signal')} {notice.targetGalaxyId ? `· ${notice.targetGalaxyId}` : ''}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <MiniButton onClick={() => setDraft(notice)}>{language === 'en' ? 'Edit' : '수정'}</MiniButton>
                <MiniButton onClick={() => onDelete?.(notice.id)}>{language === 'en' ? 'Delete' : '삭제'}</MiniButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContentSection({ language, documents, draft, setDraft, onSave, saving }) {
  const templates = AdminService.getManagedDocumentTemplates(language);
  const isEditing = Boolean(draft.id && documents.some((item) => item.id === draft.id));
  return (
    <div>
      <SectionHeader kicker="Content" title={language === 'en' ? 'Policy & Public Docs' : '정책 & 공개 문서'} description={language === 'en' ? 'Manage policy pages and public documents. Slug becomes the public address text.' : '정책 페이지와 공개 문서를 관리합니다. 슬러그는 문서 주소에 쓰이는 식별자입니다.'} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ ...cardStyle, padding: 18 }}>
          <FieldLabel>ID</FieldLabel>
          <FieldInput value={draft.id} onChange={(event) => setDraft((prev) => ({ ...prev, id: event.target.value }))} />
          <FieldLabel>Slug</FieldLabel>
          <FieldInput value={draft.slug} onChange={(event) => setDraft((prev) => ({ ...prev, slug: event.target.value }))} />
          <FieldHint>{language === 'en' ? 'Public URL text for this document. Keep it readable and stable.' : '이 문서의 공개 URL 텍스트입니다. 짧고 읽기 쉽게 유지하세요.'}</FieldHint>
          <FieldLabel>{language === 'en' ? 'Title' : '제목'}</FieldLabel>
          <FieldInput value={draft.title} onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))} />
          <FieldLabel>{language === 'en' ? 'English Title' : '영문 제목'}</FieldLabel>
          <FieldInput value={draft.titleEn || ''} onChange={(event) => setDraft((prev) => ({ ...prev, titleEn: event.target.value }))} />
          <FieldLabel>{language === 'en' ? 'Kind' : '문서 타입'}</FieldLabel>
          <FieldSelect value={draft.kind || 'general'} onChange={(event) => setDraft((prev) => ({ ...prev, kind: event.target.value }))}>
            {['privacy', 'terms', 'faq', 'about', 'general'].map((value) => <option key={value} value={value}>{value}</option>)}
          </FieldSelect>
          <TwoCol>
            <div>
              <FieldLabel>{language === 'en' ? 'Version' : '버전'}</FieldLabel>
              <FieldInput value={draft.version} onChange={(event) => setDraft((prev) => ({ ...prev, version: event.target.value }))} />
            </div>
            <div>
              <FieldLabel>{language === 'en' ? 'Status' : '상태'}</FieldLabel>
              <FieldSelect value={draft.status} onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}>
                {['draft', 'active', 'archived'].map((value) => <option key={value} value={value}>{value}</option>)}
              </FieldSelect>
            </div>
          </TwoCol>
          <TwoCol>
            <div>
              <FieldLabel>{language === 'en' ? 'Starts At' : '시작 시각'}</FieldLabel>
              <FieldInput type="datetime-local" value={toDateTimeLocalValue(draft.startsAt)} onChange={(event) => setDraft((prev) => ({ ...prev, startsAt: fromDateTimeLocalValue(event.target.value) }))} />
            </div>
            <div>
              <FieldLabel>{language === 'en' ? 'Ends At' : '종료 시각'}</FieldLabel>
              <FieldInput type="datetime-local" value={toDateTimeLocalValue(draft.endsAt)} onChange={(event) => setDraft((prev) => ({ ...prev, endsAt: fromDateTimeLocalValue(event.target.value) }))} />
            </div>
          </TwoCol>
          <FieldLabel>{language === 'en' ? 'Korean Body' : '본문(한글)'}</FieldLabel>
          <FieldTextarea rows={12} value={draft.body} onChange={(event) => setDraft((prev) => ({ ...prev, body: event.target.value }))} />
          <FieldHint>{language === 'en' ? 'Write the canonical Korean version here first, then localize the English body below.' : '먼저 기준이 되는 한글 문서를 작성하고, 아래에서 영문 버전을 로컬라이즈하세요.'}</FieldHint>
          <FieldLabel>{language === 'en' ? 'English Body' : '본문(영문)'}</FieldLabel>
          <FieldTextarea rows={10} value={draft.bodyEn || ''} onChange={(event) => setDraft((prev) => ({ ...prev, bodyEn: event.target.value }))} />
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <MiniButton disabled={saving} onClick={() => onSave?.(draft)}>
              {saving ? (language === 'en' ? 'Saving...' : '저장 중...') : isEditing ? (language === 'en' ? 'Update Document' : '문서 수정') : (language === 'en' ? 'Save Document' : '문서 저장')}
            </MiniButton>
            <MiniButton onClick={() => setDraft(AdminService.getDefaultDocument(language))}>
              {language === 'en' ? 'Reset' : '초기화'}
            </MiniButton>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ ...cardStyle, padding: 14 }}>
            <div style={{ fontSize: 13, color: '#F0EEFF', marginBottom: 8 }}>
              {language === 'en' ? 'Managed Templates' : '기본 운영 문서'}
            </div>
            {templates.map((template) => (
              <div key={template.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(123,112,224,.08)' }}>
                <div style={{ fontSize: 12, color: 'rgba(220,214,255,.74)' }}>{template.title}</div>
                <MiniButton onClick={() => setDraft({ ...template, ...(documents.find((item) => item.id === template.id) || {}) })}>
                  {language === 'en' ? 'Open' : '열기'}
                </MiniButton>
              </div>
            ))}
          </div>
          {documents.map((document) => (
            <div key={document.id} style={{ ...cardStyle, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ color: '#F0EEFF' }}>{language === 'en' ? (document.titleEn || document.title) : (document.title || document.titleEn)}</div>
                <span style={{ fontSize: 10, color: 'rgba(220,214,255,.66)' }}>{document.version}</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(214,209,255,.68)', lineHeight: 1.6, marginTop: 6 }}>{document.slug}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <MiniButton onClick={() => setDraft(document)}>{language === 'en' ? 'Edit' : '수정'}</MiniButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ language, draft, setDraft, onSave, saving }) {
  return (
    <div>
      <SectionHeader kicker="Settings" title={language === 'en' ? 'System Settings' : '시스템 설정'} description={language === 'en' ? 'Control maintenance mode, support routing, popup exposure, and monitoring notes. YouTube status is monitored automatically.' : '점검 모드, 지원 메일, 팝업 노출, 운영 메모를 제어합니다. YouTube 상태는 사용량과 에러를 기준으로 자동 감시됩니다.'} />
      <div style={{ ...cardStyle, padding: 18, maxWidth: 780 }}>
        <ToggleRow label={language === 'en' ? 'Maintenance Mode' : '점검 모드'} checked={Boolean(draft.maintenanceMode)} onChange={() => setDraft((prev) => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))} />
        <ToggleRow label={language === 'en' ? 'Popup Enabled' : '팝업 활성화'} checked={Boolean(draft.popupEnabled)} onChange={() => setDraft((prev) => ({ ...prev, popupEnabled: !prev.popupEnabled }))} />
        <ToggleRow label={language === 'en' ? 'Universe Edit Lock' : '우주 편집 잠금'} checked={Boolean(draft.universeEditLock)} onChange={() => setDraft((prev) => ({ ...prev, universeEditLock: !prev.universeEditLock }))} />
        <FieldLabel>{language === 'en' ? 'Support Email' : '지원 이메일'}</FieldLabel>
        <FieldInput value={draft.supportEmail || ''} onChange={(event) => setDraft((prev) => ({ ...prev, supportEmail: event.target.value }))} />
        <FieldLabel>{language === 'en' ? 'YouTube API Monitoring' : 'YouTube API 모니터링'}</FieldLabel>
        <div style={{ ...cardStyle, padding: 12, background: 'rgba(8,6,24,.56)', marginTop: 6 }}>
          <div style={{ fontSize: 12, color: '#F0EEFF' }}>{draft.monitoredYoutubeStatus || draft.youtubeApiStatus || 'unknown'}</div>
          <div style={{ fontSize: 11, color: 'rgba(220,214,255,.72)', lineHeight: 1.65, marginTop: 6 }}>
            {language === 'en'
              ? 'This is not a manual dropdown. The status is monitored automatically from API usage, quota pressure, and unresolved YouTube-related errors.'
              : '이 값은 수동 드롭다운이 아니라 자동 모니터링 상태입니다. API 사용량, 쿼터 압박, 미해결 YouTube 관련 에러를 기준으로 계산됩니다.'}
          </div>
        </div>
        <FieldLabel>{language === 'en' ? 'Planet Limits' : '행성 제한값'}</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          <div>
            <FieldLabel>{language === 'en' ? 'Free planet max' : 'Free 행성 최대 수'}</FieldLabel>
            <FieldInput type="number" value={draft.limits?.freePlanetMax ?? 3} onChange={(event) => setDraft((prev) => ({ ...prev, limits: { ...(prev.limits || {}), freePlanetMax: Number(event.target.value || 0) } }))} />
          </div>
          <div>
            <FieldLabel>{language === 'en' ? 'Plus planet max' : 'Plus 행성 최대 수'}</FieldLabel>
            <FieldInput type="number" value={draft.limits?.plusPlanetMax ?? 30} onChange={(event) => setDraft((prev) => ({ ...prev, limits: { ...(prev.limits || {}), plusPlanetMax: Number(event.target.value || 0) } }))} />
          </div>
          <div>
            <FieldLabel>{language === 'en' ? 'Free tracks per planet' : 'Free 행성당 곡 수'}</FieldLabel>
            <FieldInput type="number" value={draft.limits?.freeStarsPerPlanet ?? 10} onChange={(event) => setDraft((prev) => ({ ...prev, limits: { ...(prev.limits || {}), freeStarsPerPlanet: Number(event.target.value || 0) } }))} />
          </div>
          <div>
            <FieldLabel>{language === 'en' ? 'Plus tracks per planet' : 'Plus 행성당 곡 수'}</FieldLabel>
            <FieldInput type="number" value={draft.limits?.plusStarsPerPlanet ?? 30} onChange={(event) => setDraft((prev) => ({ ...prev, limits: { ...(prev.limits || {}), plusStarsPerPlanet: Number(event.target.value || 0) } }))} />
          </div>
        </div>
        <FieldHint>
          {language === 'en'
            ? 'These values now drive the live planet creation studio instead of staying as copy only.'
            : '이 값들은 이제 설명 문구가 아니라 실제 행성 생성 스튜디오 제한값으로 동작합니다.'}
        </FieldHint>
        <FieldLabel>{language === 'en' ? 'API Notes' : 'API 메모'}</FieldLabel>
        <FieldTextarea value={draft.apiNotes || ''} onChange={(event) => setDraft((prev) => ({ ...prev, apiNotes: event.target.value }))} />
        <FieldHint>
          {language === 'en'
            ? 'Use this area for operator notes such as quota incidents, provider migration plans, or temporary fallback rules.'
            : '이 영역에는 쿼터 이슈, provider 교체 계획, 임시 fallback 규칙처럼 운영 메모를 남기세요.'}
        </FieldHint>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <MiniButton disabled={saving} onClick={() => onSave?.(draft)}>
            {saving ? (language === 'en' ? 'Saving...' : '저장 중...') : (language === 'en' ? 'Save Settings' : '설정 저장')}
          </MiniButton>
        </div>
      </div>
    </div>
  );
}

function AuditSection({ language, auditLogs }) {
  return (
    <div>
      <SectionHeader kicker="Audit" title={language === 'en' ? 'Change History' : '변경 기록'} description={language === 'en' ? 'This menu exists to explain why a change happened, who made it, and what was saved.' : '이 메뉴는 왜 변경이 일어났는지, 누가 저장했는지, 무엇이 바뀌었는지 기록으로 남기기 위한 곳입니다.'} />
      <FieldHint>
        {language === 'en'
          ? 'Use this when you need to trace an operator action after a mistaken edit, content change, or promotion incident.'
          : '잘못된 수정, 콘텐츠 변경, 프로모션 사고 이후에 누가 어떤 저장을 했는지 추적할 때 이 기록을 사용하세요.'}
      </FieldHint>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(auditLogs || []).length === 0 && (
          <div style={{ ...cardStyle, padding: 18, color: 'rgba(220,214,255,.72)' }}>
            {language === 'en' ? 'No audit logs were loaded yet.' : '불러온 감사 로그가 아직 없습니다.'}
          </div>
        )}
        {(auditLogs || []).slice(0, 24).map((log) => (
          <div key={log.id} style={{ ...cardStyle, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
              <div style={{ color: '#F0EEFF', fontSize: 13 }}>{log.action}</div>
              <span style={{ fontSize: 10, color: 'rgba(220,214,255,.66)' }}>{formatDateTime(log.createdAt, language)}</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(214,209,255,.68)', lineHeight: 1.65, marginTop: 6 }}>
              {(log.actorName || log.actorEmail || log.actorUid || 'unknown')} · {log.section} · {log.targetId || 'n/a'}
            </div>
            <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(9,7,28,.82)', border: '1px solid rgba(123,112,224,.12)', fontSize: 11, color: 'rgba(220,214,255,.72)', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {safeJson(log.payload)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorsSection({ language, errors, draft, setDraft, onSave, saving }) {
  const isEditing = Boolean(draft.id && errors.some((item) => item.id === draft.id));
  const sortedErrors = React.useMemo(() => {
    const severityRank = { critical: 0, error: 1, warning: 2, info: 3 };
    return [...(errors || [])].sort((left, right) => {
      const leftResolved = left.status === 'resolved' || left.resolved;
      const rightResolved = right.status === 'resolved' || right.resolved;
      if (leftResolved !== rightResolved) return leftResolved ? 1 : -1;
      const leftDeleted = left.status === 'deleted';
      const rightDeleted = right.status === 'deleted';
      if (leftDeleted !== rightDeleted) return leftDeleted ? 1 : -1;
      const severityDiff = (severityRank[left.level] ?? 99) - (severityRank[right.level] ?? 99);
      if (severityDiff !== 0) return severityDiff;
      return String(right.createdAt || '').localeCompare(String(left.createdAt || ''));
    });
  }, [errors]);
  const openCount = sortedErrors.filter((item) => (item.status || (item.resolved ? 'resolved' : 'pending')) === 'pending').length;
  const resolvedCount = sortedErrors.filter((item) => (item.status || (item.resolved ? 'resolved' : 'pending')) === 'resolved').length;
  const deletedCount = sortedErrors.filter((item) => (item.status || (item.resolved ? 'resolved' : 'pending')) === 'deleted').length;
  const selectedStatus = draft.status || (draft.resolved ? 'resolved' : 'pending');
  return (
    <div>
      <SectionHeader kicker="Error Center" title={language === 'en' ? 'Service Error Center' : '서비스 에러 센터'} description={language === 'en' ? 'Review service errors as cards, open one to inspect the cause, then manage it as pending, resolved, or deleted.' : '서비스 에러를 카드로 보고, 원인을 확인한 뒤 pending, resolved, 삭제 상태로 관리하는 곳입니다.'} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
        <MetricCard label={language === 'en' ? 'Pending' : '미해결'} value={openCount} />
        <MetricCard label={language === 'en' ? 'Resolved' : '해결됨'} value={resolvedCount} />
        <MetricCard label={language === 'en' ? 'Deleted' : '삭제 처리'} value={deletedCount} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, .92fr) minmax(420px, 1.08fr)', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(sortedErrors || []).length === 0 && (
          <div style={{ ...cardStyle, padding: 18, color: 'rgba(220,214,255,.72)' }}>
            {language === 'en' ? 'No error logs were loaded yet.' : '불러온 에러 로그가 아직 없습니다.'}
          </div>
        )}
        {(sortedErrors || []).map((errorItem) => {
          const status = errorItem.status || (errorItem.resolved ? 'resolved' : 'pending');
          return (
          <button key={errorItem.id} type="button" onClick={() => setDraft(errorItem)} style={{ ...cardStyle, width: '100%', padding: 14, textAlign: 'left', cursor: 'pointer', background: draft.id === errorItem.id ? 'rgba(16,12,40,.86)' : 'rgba(8,6,24,.62)', border: draft.id === errorItem.id ? '1px solid rgba(155,145,255,.32)' : '1px solid rgba(123,112,224,.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: '#F0EEFF' }}>{errorItem.title || errorItem.message || errorItem.id}</div>
                <div style={{ fontSize: 11, color: 'rgba(214,209,255,.68)', lineHeight: 1.6, marginTop: 6 }}>
                  {errorItem.message || errorItem.context || ''}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,107,107,.72)' }}>{errorItem.level || 'error'}</span>
                <StatusPill status={status} language={language} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 10, fontSize: 10, color: 'rgba(178,170,255,.66)' }}>
              <span>{errorItem.context || (language === 'en' ? 'No context' : '컨텍스트 없음')}</span>
              <span>{formatDateTime(errorItem.createdAt, language)}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <MiniButton onClick={(event) => {
                event.stopPropagation();
                setDraft(errorItem);
              }}>{language === 'en' ? 'Inspect' : '상세 보기'}</MiniButton>
              <MiniButton onClick={(event) => {
                event.stopPropagation();
                onSave?.({ ...errorItem, status: 'resolved', resolved: true });
              }}>{language === 'en' ? 'Resolve' : '해결 처리'}</MiniButton>
              <MiniButton onClick={(event) => {
                event.stopPropagation();
                const confirmed = window.confirm(language === 'en' ? 'Are you sure you want to delete this error card?' : '정말 삭제하시겠습니까?');
                if (!confirmed) return;
                onSave?.({ ...errorItem, status: 'deleted', resolved: false });
              }}>{language === 'en' ? 'Hide' : '삭제 처리'}</MiniButton>
            </div>
          </button>
        )})}
        </div>
        <div style={{ ...cardStyle, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 14, color: '#F0EEFF' }}>
                {draft.id ? (language === 'en' ? 'Selected Error' : '선택된 에러') : (language === 'en' ? 'New Error Log' : '새 에러 로그')}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(220,214,255,.68)', lineHeight: 1.6, marginTop: 6 }}>
                {draft.id
                  ? (language === 'en' ? 'Review the cause, update the handling status, and keep a traceable record.' : '원인을 검토하고 처리 상태를 바꾸며, 추적 가능한 기록으로 유지하세요.')
                  : (language === 'en' ? 'Use this form to seed or log a new service issue.' : '이 폼으로 새 서비스 이슈를 기록하거나 테스트 로그를 만들 수 있습니다.')}
              </div>
            </div>
            <StatusPill status={selectedStatus} language={language} />
          </div>
          {draft.createdAt ? (
            <div style={{ ...cardStyle, padding: 12, marginBottom: 12, background: 'rgba(9,7,28,.82)' }}>
              <div style={{ fontSize: 10, color: 'rgba(178,170,255,.62)', letterSpacing: '.14em', textTransform: 'uppercase' }}>
                {language === 'en' ? 'Latest Event' : '최근 이벤트'}
              </div>
              <div style={{ fontSize: 12, color: '#F0EEFF', marginTop: 8 }}>
                {formatDateTime(draft.createdAt, language)}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(220,214,255,.72)', lineHeight: 1.6, marginTop: 6 }}>
                {draft.context || (language === 'en' ? 'No context attached yet.' : '아직 연결된 컨텍스트가 없습니다.')}
              </div>
            </div>
          ) : null}
          <FieldLabel>{language === 'en' ? 'Title' : '제목'}</FieldLabel>
          <FieldInput value={draft.title} onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))} />
          <FieldLabel>{language === 'en' ? 'Message' : '메시지'}</FieldLabel>
          <FieldTextarea value={draft.message} onChange={(event) => setDraft((prev) => ({ ...prev, message: event.target.value }))} />
          <TwoCol>
            <div>
              <FieldLabel>{language === 'en' ? 'Level' : '레벨'}</FieldLabel>
              <FieldSelect value={draft.level} onChange={(event) => setDraft((prev) => ({ ...prev, level: event.target.value }))}>
                {['info', 'warning', 'error', 'critical'].map((value) => <option key={value} value={value}>{value}</option>)}
              </FieldSelect>
            </div>
            <div>
              <FieldLabel>{language === 'en' ? 'Handling Status' : '처리 상태'}</FieldLabel>
              <FieldSelect value={draft.status || (draft.resolved ? 'resolved' : 'pending')} onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value, resolved: event.target.value === 'resolved' }))}>
                <option value="pending">pending</option>
                <option value="resolved">resolved</option>
                <option value="deleted">deleted</option>
              </FieldSelect>
            </div>
          </TwoCol>
          <FieldLabel>{language === 'en' ? 'Context' : '컨텍스트'}</FieldLabel>
          <FieldInput value={draft.context} onChange={(event) => setDraft((prev) => ({ ...prev, context: event.target.value }))} />
          <FieldLabel>Stack</FieldLabel>
          <FieldTextarea rows={6} value={draft.stack} onChange={(event) => setDraft((prev) => ({ ...prev, stack: event.target.value }))} />
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <MiniButton disabled={saving} onClick={() => onSave?.(draft)}>
              {saving ? (language === 'en' ? 'Saving...' : '저장 중...') : isEditing ? (language === 'en' ? 'Update Error' : '에러 수정') : (language === 'en' ? 'Save Error' : '에러 저장')}
            </MiniButton>
            {draft.id ? (
              <MiniButton onClick={() => onSave?.({ ...draft, status: 'resolved', resolved: true })}>
                {language === 'en' ? 'Mark Resolved' : '해결 처리'}
              </MiniButton>
            ) : null}
            {draft.id ? (
              <MiniButton onClick={() => {
                const confirmed = window.confirm(language === 'en' ? 'Are you sure you want to delete this error card?' : '정말 삭제하시겠습니까?');
                if (!confirmed) return;
                onSave?.({ ...draft, status: 'deleted', resolved: false });
              }}>
                {language === 'en' ? 'Delete' : '삭제'}
              </MiniButton>
            ) : null}
            <MiniButton onClick={() => setDraft(AdminService.getDefaultErrorLog())}>{language === 'en' ? 'Reset' : '초기화'}</MiniButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinanceSection({ language, payments, overview, draft, setDraft, onSave, saving }) {
  const isEditing = Boolean(draft.id && payments.some((item) => item.id === draft.id));
  return (
    <div>
      <SectionHeader kicker="Finance" title={language === 'en' ? 'Revenue Analytics' : '매출 분석'} description={language === 'en' ? 'Track payments, sponsorships, and revenue totals across multiple windows.' : '결제, 스폰서십, 매출 총합을 여러 기간으로 추적합니다.'} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10 }}>
        <MetricCard label="Today" value={pickCurrency(overview?.revenue?.today, language)} />
        <MetricCard label="Week" value={pickCurrency(overview?.revenue?.week, language)} />
        <MetricCard label="Month" value={pickCurrency(overview?.revenue?.month, language)} />
        <MetricCard label="Year" value={pickCurrency(overview?.revenue?.year, language)} />
        <MetricCard label="All" value={pickCurrency(overview?.revenue?.all, language)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div style={{ ...cardStyle, padding: 18 }}>
          <div style={{ fontSize: 13, color: '#F0EEFF', marginBottom: 12 }}>
            {language === 'en' ? 'Payment Record' : '결제 기록 입력'}
          </div>
          <FieldLabel>{language === 'en' ? 'Provider' : '결제 제공사'}</FieldLabel>
          <FieldSelect value={draft.provider} onChange={(event) => setDraft((prev) => ({ ...prev, provider: event.target.value }))}>
            {['stripe', 'lemonsqueezy', 'toss', 'kakao', 'manual'].map((value) => <option key={value} value={value}>{value}</option>)}
          </FieldSelect>
          <FieldHint>{language === 'en' ? 'Use the payment provider that actually processed this transaction. Manual is best for seed or operator-entered records.' : '실제로 결제를 처리한 제공사를 고르세요. 테스트나 수기 입력은 manual이 가장 안전합니다.'}</FieldHint>
          <TwoCol>
            <div>
              <FieldLabel>User ID</FieldLabel>
              <FieldInput value={draft.userId} onChange={(event) => setDraft((prev) => ({ ...prev, userId: event.target.value }))} />
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              <FieldInput value={draft.userEmail} onChange={(event) => setDraft((prev) => ({ ...prev, userEmail: event.target.value }))} />
            </div>
          </TwoCol>
          <TwoCol>
            <div>
              <FieldLabel>{language === 'en' ? 'Amount' : '금액'}</FieldLabel>
              <FieldInput type="number" value={draft.amount} onChange={(event) => setDraft((prev) => ({ ...prev, amount: Number(event.target.value || 0) }))} />
            </div>
            <div>
              <FieldLabel>{language === 'en' ? 'Currency' : '통화'}</FieldLabel>
              <FieldInput value={draft.currency} onChange={(event) => setDraft((prev) => ({ ...prev, currency: event.target.value }))} />
            </div>
          </TwoCol>
          <TwoCol>
            <div>
              <FieldLabel>{language === 'en' ? 'Status' : '상태'}</FieldLabel>
              <FieldSelect value={draft.status} onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}>
                {['paid', 'pending', 'refunded', 'failed'].map((value) => <option key={value} value={value}>{value}</option>)}
              </FieldSelect>
            </div>
            <div>
              <FieldLabel>{language === 'en' ? 'Product Type' : '상품 타입'}</FieldLabel>
              <FieldInput value={draft.productType} onChange={(event) => setDraft((prev) => ({ ...prev, productType: event.target.value }))} />
              <FieldHint>{language === 'en' ? 'Examples: brand_orbit, campaign_burst, label_residency, plus_membership.' : '예: brand_orbit, campaign_burst, label_residency, plus_membership 처럼 내부 상품 단위를 적습니다.'}</FieldHint>
            </div>
          </TwoCol>
          <TwoCol>
            <div>
              <FieldLabel>{language === 'en' ? 'Promotion Type' : '프로모션 타입'}</FieldLabel>
              <FieldSelect value={draft.promotionType} onChange={(event) => setDraft((prev) => ({ ...prev, promotionType: event.target.value }))}>
                {['brand', 'campaign', 'label'].map((value) => <option key={value} value={value}>{value}</option>)}
              </FieldSelect>
            </div>
            <div>
              <FieldLabel>{language === 'en' ? 'Paid At' : '결제 시각'}</FieldLabel>
              <FieldInput type="datetime-local" value={toDateTimeLocalValue(draft.paidAt)} onChange={(event) => setDraft((prev) => ({ ...prev, paidAt: fromDateTimeLocalValue(event.target.value) }))} />
            </div>
          </TwoCol>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <MiniButton disabled={saving} onClick={() => onSave?.(draft)}>{saving ? (language === 'en' ? 'Saving...' : '저장 중...') : isEditing ? (language === 'en' ? 'Update Payment' : '결제 수정') : (language === 'en' ? 'Save Payment' : '결제 저장')}</MiniButton>
            <MiniButton onClick={() => setDraft(AdminService.getDefaultPayment())}>{language === 'en' ? 'Reset' : '초기화'}</MiniButton>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: 18 }}>
        <div style={{ fontSize: 14, color: '#F0EEFF', marginBottom: 12 }}>
          {language === 'en' ? 'Recent Payments' : '최근 결제'}
        </div>
        {(payments || []).slice(0, 12).map((payment) => (
          <div key={payment.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(123,112,224,.08)' }}>
            <div style={{ fontSize: 12, color: 'rgba(220,214,255,.74)' }}>{payment.userEmail || payment.userId || payment.id}</div>
            <div style={{ fontSize: 12, color: '#F0EEFF' }}>{pickCurrency(payment.amount || payment.total || 0, language)}</div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}

function ApiUsageSection({ language, apiUsage, overview, settings, draft, setDraft, onSave, saving }) {
  const knownApiLabels = AdminService.getKnownApiLabels();
  const apiCards = React.useMemo(() => {
    const baseMap = new Map(
      knownApiLabels.map((label) => [
        label,
        { label, requests: 0, errors: 0, remainingQuota: null, warningThreshold: null, latestDate: null },
      ])
    );

    (apiUsage || []).forEach((item) => {
      const key = item.label || item.id || 'unknown_api';
      const next = baseMap.get(key) || { label: key, requests: 0, errors: 0, remainingQuota: null, warningThreshold: null, latestDate: null };
      next.requests += Number(item.requests || 0);
      next.errors += Number(item.errors || 0);
      next.remainingQuota = item.remainingQuota ?? next.remainingQuota;
      next.warningThreshold = item.warningThreshold ?? next.warningThreshold;
      next.latestDate = item.date || next.latestDate;
      baseMap.set(key, next);
    });

    return [...baseMap.values()]
      .map((item) => ({ ...item, health: deriveApiHealth(item.label, item, settings) }))
      .sort((left, right) => {
        const severityRank = { degraded: 0, unknown: 1, healthy: 2 };
        const severityDiff = (severityRank[left.health] ?? 99) - (severityRank[right.health] ?? 99);
        if (severityDiff !== 0) return severityDiff;
        return String(left.label || '').localeCompare(String(right.label || ''));
      });
  }, [apiUsage, knownApiLabels, settings]);
  const isEditing = Boolean(draft.id && apiUsage.some((item) => item.id === draft.id));
  return (
    <div>
      <SectionHeader kicker="API Usage" title={language === 'en' ? 'Connected API Monitoring' : '연결 API 모니터링'} description={language === 'en' ? 'This page automatically expands as new API labels are added. Monitor each API’s health, quota, and request load here.' : '새 API 라벨이 추가되면 이 페이지도 함께 확장됩니다. 각 API의 상태, 쿼터, 요청량을 여기서 모니터링합니다.'} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ ...cardStyle, padding: 18 }}>
          <div style={{ fontSize: 14, color: '#F0EEFF', marginBottom: 10 }}>
            {language === 'en' ? 'Usage Trend' : '사용량 추이'}
          </div>
          <MiniChart data={overview?.trends?.apiUsage ?? []} accent="#71C7D8" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <StatusRow tone={toneForStatus(overview?.apiStatus?.firebase)} label="Firebase" value={overview?.apiStatus?.firebase || 'unknown'} />
          <StatusRow tone={toneForStatus(overview?.apiStatus?.youtube)} label="YouTube API" value={overview?.apiStatus?.youtube || 'unknown'} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginTop: 14 }}>
        {apiCards.map((item) => (
          <div key={item.label} style={{ ...cardStyle, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: '#F0EEFF' }}>{formatProviderLabel(item.label)}</div>
              <StatusPill status={item.health} language={language} />
            </div>
            <div style={{ fontSize: 11, color: 'rgba(220,214,255,.72)', marginTop: 8, lineHeight: 1.65 }}>
              {language === 'en'
                ? `${item.requests} requests · ${item.errors} errors`
                : `${item.requests} 요청 · ${item.errors} 에러`}
            </div>
            {item.remainingQuota != null && (
              <div style={{ fontSize: 10, color: 'rgba(178,170,255,.66)', marginTop: 6 }}>
                {language === 'en' ? `Remaining quota ${item.remainingQuota}` : `남은 쿼터 ${item.remainingQuota}`}
              </div>
            )}
            <div style={{ fontSize: 10, color: 'rgba(178,170,255,.66)', marginTop: 6 }}>
              {item.latestDate
                ? (language === 'en' ? `Latest record ${item.latestDate}` : `최근 기록 ${item.latestDate}`)
                : (language === 'en' ? 'No usage recorded yet' : '아직 사용 기록이 없습니다.')}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div style={{ ...cardStyle, padding: 18 }}>
        <div style={{ fontSize: 13, color: '#F0EEFF', marginBottom: 12 }}>
          {language === 'en' ? 'API Entry' : 'API 기록 입력'}
        </div>
          <TwoCol>
            <div>
              <FieldLabel>Label</FieldLabel>
              <FieldInput list="known-api-labels" value={draft.label} onChange={(event) => setDraft((prev) => ({ ...prev, label: event.target.value }))} placeholder="youtube / firebase / ai_api / custom" />
              <datalist id="known-api-labels">
                {knownApiLabels.map((value) => <option key={value} value={value} />)}
              </datalist>
              <FieldHint>{language === 'en' ? 'If a new provider is added later, use its label here and this page will create a new monitoring card automatically.' : '새 provider가 추가되면 그 라벨을 그대로 적으세요. 이 페이지는 그 라벨을 기준으로 새 모니터링 카드를 자동 생성합니다.'}</FieldHint>
            </div>
            <div>
              <FieldLabel>{language === 'en' ? 'Date' : '날짜'}</FieldLabel>
              <FieldInput type="date" value={draft.date} onChange={(event) => setDraft((prev) => ({ ...prev, date: event.target.value }))} />
            </div>
          </TwoCol>
          <TwoCol>
            <div>
              <FieldLabel>{language === 'en' ? 'Requests' : '요청 수'}</FieldLabel>
              <FieldInput type="number" value={draft.requests} onChange={(event) => setDraft((prev) => ({ ...prev, requests: Number(event.target.value || 0) }))} />
            </div>
            <div>
              <FieldLabel>{language === 'en' ? 'Errors' : '에러 수'}</FieldLabel>
              <FieldInput type="number" value={draft.errors} onChange={(event) => setDraft((prev) => ({ ...prev, errors: Number(event.target.value || 0) }))} />
            </div>
          </TwoCol>
          <TwoCol>
            <div>
              <FieldLabel>{language === 'en' ? 'Remaining Quota' : '남은 쿼터'}</FieldLabel>
              <FieldInput type="number" value={draft.remainingQuota} onChange={(event) => setDraft((prev) => ({ ...prev, remainingQuota: Number(event.target.value || 0) }))} />
            </div>
            <div>
              <FieldLabel>{language === 'en' ? 'Warning Threshold' : '경고 임계치'}</FieldLabel>
              <FieldInput type="number" value={draft.warningThreshold} onChange={(event) => setDraft((prev) => ({ ...prev, warningThreshold: Number(event.target.value || 0) }))} />
            </div>
          </TwoCol>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <MiniButton disabled={saving} onClick={() => onSave?.(draft)}>{saving ? (language === 'en' ? 'Saving...' : '저장 중...') : isEditing ? (language === 'en' ? 'Update API Entry' : 'API 기록 수정') : (language === 'en' ? 'Save API Entry' : 'API 기록 저장')}</MiniButton>
            <MiniButton onClick={() => setDraft(AdminService.getDefaultApiUsage())}>{language === 'en' ? 'Reset' : '초기화'}</MiniButton>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(220,214,255,.72)', lineHeight: 1.65, marginTop: 12 }}>
            {language === 'en'
              ? 'You can add any future API label here. Common labels are suggested, but custom providers are supported.'
              : '여기에는 앞으로 추가될 어떤 API 라벨도 넣을 수 있습니다. 기본 추천값은 보이지만, 커스텀 provider도 그대로 기록할 수 있습니다.'}
          </div>
        </div>
        <div style={{ ...cardStyle, padding: 18 }}>
        <div style={{ fontSize: 14, color: '#F0EEFF', marginBottom: 12 }}>
          {language === 'en' ? 'Recent API Entries' : '최근 API 기록'}
        </div>
        {(apiUsage || []).slice(0, 12).map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(123,112,224,.08)' }}>
            <div style={{ fontSize: 12, color: 'rgba(220,214,255,.74)' }}>{item.label || item.date || item.id}</div>
            <div style={{ fontSize: 12, color: '#F0EEFF' }}>{item.requests || item.totalRequests || 0}</div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}

function DesignEditor({ draft, setDraft, language }) {
  const design = draft.design || {};
  const palette = design.palette || {};
  return (
    <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid rgba(123,112,224,.12)' }}>
      <div style={{ fontSize: 14, color: '#F0EEFF', marginBottom: 10 }}>
        {language === 'en' ? 'Promotion Design' : '프로모션 디자인'}
      </div>
      <DesignPreviewCard draft={draft} language={language} />
      <TwoCol>
        <div>
          <FieldLabel>Theme</FieldLabel>
          <FieldSelect value={design.theme || 'luxury'} onChange={(event) => setDraft((prev) => ({ ...prev, design: { ...prev.design, theme: event.target.value } }))}>
            {['luxury', 'broadcast', 'editorial', 'aurora', 'signal', 'ceramic'].map((value) => <option key={value} value={value}>{value}</option>)}
          </FieldSelect>
        </div>
        <div>
          <FieldLabel>Surface</FieldLabel>
          <FieldSelect value={design.surface || 'glass'} onChange={(event) => setDraft((prev) => ({ ...prev, design: { ...prev.design, surface: event.target.value } }))}>
            {['glass', 'metal', 'mist', 'pearl', 'plasma'].map((value) => <option key={value} value={value}>{value}</option>)}
          </FieldSelect>
        </div>
      </TwoCol>
      <TwoCol>
        <div>
          <FieldLabel>Ring Style</FieldLabel>
          <FieldSelect value={design.ringStyle || 'double'} onChange={(event) => setDraft((prev) => ({ ...prev, design: { ...prev.design, ringStyle: event.target.value } }))}>
            {['none', 'single', 'double', 'broken', 'tilted'].map((value) => <option key={value} value={value}>{value}</option>)}
          </FieldSelect>
        </div>
        <div>
          <FieldLabel>Aura</FieldLabel>
          <FieldSelect value={design.aura || 'veil'} onChange={(event) => setDraft((prev) => ({ ...prev, design: { ...prev.design, aura: event.target.value } }))}>
            {['soft', 'pulse', 'veil', 'storm'].map((value) => <option key={value} value={value}>{value}</option>)}
          </FieldSelect>
        </div>
      </TwoCol>
      <TwoCol>
        <div>
          <FieldLabel>Particles</FieldLabel>
          <FieldSelect value={design.particles || 'medium'} onChange={(event) => setDraft((prev) => ({ ...prev, design: { ...prev.design, particles: event.target.value } }))}>
            {['off', 'low', 'medium', 'high'].map((value) => <option key={value} value={value}>{value}</option>)}
          </FieldSelect>
        </div>
        <div>
          <FieldLabel>Motion</FieldLabel>
          <FieldSelect value={design.motion || 'drift'} onChange={(event) => setDraft((prev) => ({ ...prev, design: { ...prev.design, motion: event.target.value } }))}>
            {['calm', 'drift', 'ceremonial', 'broadcast'].map((value) => <option key={value} value={value}>{value}</option>)}
          </FieldSelect>
        </div>
      </TwoCol>
      <TwoCol>
        <div>
          <FieldLabel>Scale Tier</FieldLabel>
          <FieldSelect value={design.scaleTier || 'hero'} onChange={(event) => setDraft((prev) => ({ ...prev, design: { ...prev.design, scaleTier: event.target.value } }))}>
            {['standard', 'hero', 'monument'].map((value) => <option key={value} value={value}>{value}</option>)}
          </FieldSelect>
        </div>
        <div>
          <FieldLabel>{language === 'en' ? 'Design Story' : '디자인 스토리'}</FieldLabel>
          <FieldInput value={design.story || ''} onChange={(event) => setDraft((prev) => ({ ...prev, design: { ...prev.design, story: event.target.value } }))} />
        </div>
      </TwoCol>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
        {[
          ['primary', palette.primary || '#E38CB8'],
          ['secondary', palette.secondary || '#F4D4AE'],
          ['accent', palette.accent || '#F6CCE4'],
          ['glow', palette.glow || '#EBC8F0'],
        ].map(([key, value]) => (
          <div key={key}>
            <FieldLabel>{key}</FieldLabel>
            <FieldInput value={value} onChange={(event) => setDraft((prev) => ({ ...prev, design: { ...prev.design, palette: { ...(prev.design?.palette ?? {}), [key]: event.target.value } } }))} />
          </div>
        ))}
      </div>
    </div>
  );
}

function DesignPreviewCard({ draft, language }) {
  const design = draft.design || {};
  const palette = {
    primary: design.palette?.primary || '#E38CB8',
    secondary: design.palette?.secondary || '#F4D4AE',
    accent: design.palette?.accent || '#F6CCE4',
    glow: design.palette?.glow || '#EBC8F0',
  };
  const scaleTier = design.scaleTier || 'hero';
  const themeBackdrop = getThemeBackdrop(design.theme || 'luxury', palette);
  const motionLabel = getMotionLabel(design.motion || 'drift', language);
  const sizeTier = scaleTier === 'monument' ? 'large' : scaleTier === 'standard' ? 'small' : 'medium';
  const hasRing = (design.ringStyle || 'double') !== 'none';
  const particleStyle =
    design.particles === 'high'
      ? 'pulse'
      : design.particles === 'low'
        ? 'mist'
        : design.particles === 'off'
          ? 'trail'
          : 'stardust';
  const customPalette = {
    fillA: palette.primary,
    fillB: palette.secondary,
    fillC: palette.accent,
    glow: palette.glow,
    ring: palette.secondary,
    trail: palette.accent,
  };

  return (
    <div
      style={{
        ...cardStyle,
        padding: 16,
        marginBottom: 16,
        background: `linear-gradient(180deg, rgba(10,7,28,.92), rgba(5,4,18,.96)), ${themeBackdrop}`,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(260px, .95fr)', gap: 18, alignItems: 'center' }}>
        <div
          style={{
            position: 'relative',
            minHeight: 280,
            overflow: 'hidden',
          }}
        >
          <PlanetOrbitPreview
            name={draft.title || (language === 'en' ? 'Untitled Promotion Planet' : '이름 없는 프로모션 행성')}
            description={design.story || ''}
            paletteKey="deep"
            surfaceType={design.surface || 'rocky'}
            particleStyle={particleStyle}
            sizeTier={sizeTier}
            hasRing={hasRing}
            customPalette={customPalette}
            previewHeight={280}
          />
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(178,170,255,.66)', letterSpacing: '.14em', textTransform: 'uppercase' }}>
            {language === 'en' ? 'Live Preview' : '실시간 프리뷰'}
          </div>
          <div style={{ fontSize: 20, color: '#F0EEFF', marginTop: 8 }}>
            {draft.title || (language === 'en' ? 'Untitled Promotion Planet' : '이름 없는 프로모션 행성')}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(220,214,255,.72)', lineHeight: 1.7, marginTop: 8 }}>
            {language === 'en'
              ? 'This panel approximates the planet silhouette, glow, ring profile, and particle density that will be generated from the current design tokens.'
              : '현재 디자인 토큰을 기준으로 실제 생성될 행성의 실루엣, 글로우, 링 프로필, 입자 밀도를 가깝게 미리 보여줍니다.'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {[
              `${language === 'en' ? 'Theme' : '테마'} · ${design.theme || 'luxury'}`,
              `${language === 'en' ? 'Surface' : '표면'} · ${design.surface || 'glass'}`,
              `${language === 'en' ? 'Ring' : '링'} · ${design.ringStyle || 'double'}`,
              `${language === 'en' ? 'Aura' : '오라'} · ${design.aura || 'veil'}`,
              `${language === 'en' ? 'Particles' : '입자'} · ${design.particles || 'medium'}`,
              `${language === 'en' ? 'Motion' : '모션'} · ${motionLabel}`,
              `${language === 'en' ? 'Scale' : '스케일'} · ${scaleTier}`,
            ].map((label) => (
              <div
                key={label}
                style={{
                  padding: '7px 10px',
                  borderRadius: 999,
                  background: 'rgba(12,9,34,.88)',
                  border: '1px solid rgba(123,112,224,.16)',
                  color: 'rgba(220,214,255,.8)',
                  fontSize: 11,
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginTop: 16 }}>
            {[
              ['Primary', palette.primary],
              ['Secondary', palette.secondary],
              ['Accent', palette.accent],
              ['Glow', palette.glow],
            ].map(([label, color]) => (
              <div key={label} style={{ ...cardStyle, padding: 10, background: 'rgba(9,7,28,.86)' }}>
                <div style={{ width: '100%', height: 38, borderRadius: 10, background: color, boxShadow: `0 0 16px ${hexToRgba(color, 0.28)}` }} />
                <div style={{ fontSize: 10, color: 'rgba(178,170,255,.62)', marginTop: 8 }}>{label}</div>
                <div style={{ fontSize: 11, color: '#F0EEFF', marginTop: 4 }}>{color}</div>
              </div>
            ))}
          </div>
          <div style={{ ...cardStyle, padding: 12, marginTop: 14, background: 'rgba(9,7,28,.82)' }}>
            <div style={{ fontSize: 10, color: 'rgba(178,170,255,.62)', letterSpacing: '.14em', textTransform: 'uppercase' }}>
              {language === 'en' ? 'Operator Note' : '운영 메모'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(220,214,255,.76)', lineHeight: 1.7, marginTop: 8 }}>
              {design.story || (language === 'en' ? 'Add a short design story so admins can remember why this planet should look this way.' : '왜 이런 디자인인지 관리자들이 기억할 수 있도록 짧은 디자인 스토리를 남겨두세요.')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ item, language, onClick }) {
  const toneStyles = {
    red: {
      border: 'rgba(255,107,107,.24)',
      glow: 'rgba(255,107,107,.16)',
      badge: 'rgba(255,107,107,.22)',
      label: '#FFB0B0',
    },
    gold: {
      border: 'rgba(255,209,102,.24)',
      glow: 'rgba(255,209,102,.14)',
      badge: 'rgba(255,209,102,.2)',
      label: '#FFE09B',
    },
    blue: {
      border: 'rgba(113,199,216,.24)',
      glow: 'rgba(113,199,216,.14)',
      badge: 'rgba(113,199,216,.2)',
      label: '#B8F1FF',
    },
    green: {
      border: 'rgba(102,255,178,.2)',
      glow: 'rgba(102,255,178,.12)',
      badge: 'rgba(102,255,178,.18)',
      label: '#BDF7D5',
    },
    dim: {
      border: 'rgba(123,112,224,.18)',
      glow: 'rgba(123,112,224,.1)',
      badge: 'rgba(123,112,224,.16)',
      label: '#D6D0FF',
    },
  };
  const tone = toneStyles[item.tone] || toneStyles.dim;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...cardStyle,
        padding: 14,
        textAlign: 'left',
        cursor: onClick ? 'pointer' : 'default',
        border: `1px solid ${tone.border}`,
        background: `linear-gradient(180deg, ${tone.glow}, rgba(7,5,20,.86))`,
      }}
    >
      <div style={{ display: 'inline-flex', padding: '6px 9px', borderRadius: 999, background: tone.badge, color: tone.label, fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase' }}>
        {item.section === 'overview' ? (language === 'en' ? 'Status' : '상태') : item.section}
      </div>
      <div style={{ fontSize: 14, color: '#F0EEFF', marginTop: 10 }}>{item.title}</div>
      <div style={{ fontSize: 12, color: 'rgba(220,214,255,.74)', lineHeight: 1.65, marginTop: 8 }}>{item.detail}</div>
      {onClick ? (
        <div style={{ fontSize: 11, color: tone.label, marginTop: 12 }}>
          {language === 'en' ? 'Open section' : '섹션 열기'}
        </div>
      ) : null}
    </button>
  );
}

function getRingConfigs(ringStyle, palette) {
  const configs = [];
  if (ringStyle === 'none') return configs;

  const base = {
    color: hexToRgba(palette.secondary, 0.7),
    glowColor: palette.glow,
    borderStyle: 'solid',
    opacity: 0.8,
    stroke: 2,
  };

  if (ringStyle === 'single') {
    configs.push({ ...base, width: 220, height: 74, rotate: -18 });
  } else if (ringStyle === 'double') {
    configs.push({ ...base, width: 226, height: 76, rotate: -16 });
    configs.push({ ...base, width: 258, height: 92, rotate: -16, opacity: 0.48, stroke: 1 });
  } else if (ringStyle === 'broken') {
    configs.push({ ...base, width: 230, height: 78, rotate: -20, borderStyle: 'dashed', opacity: 0.74 });
  } else if (ringStyle === 'tilted') {
    configs.push({ ...base, width: 240, height: 72, rotate: -32 });
    configs.push({ ...base, width: 200, height: 58, rotate: 24, opacity: 0.34, stroke: 1 });
  }

  return configs;
}

function getSurfaceOverlay(surface, palette) {
  switch (surface) {
    case 'metal':
      return `linear-gradient(135deg, ${hexToRgba('#FFFFFF', 0.14)}, transparent 38%, ${hexToRgba(palette.accent, 0.16)} 74%, transparent 100%)`;
    case 'mist':
      return `radial-gradient(circle at 64% 34%, ${hexToRgba('#FFFFFF', 0.18)}, transparent 28%), radial-gradient(circle at 38% 66%, ${hexToRgba(palette.glow, 0.18)}, transparent 32%)`;
    case 'pearl':
      return `linear-gradient(145deg, ${hexToRgba('#FFFFFF', 0.24)}, transparent 34%, ${hexToRgba(palette.secondary, 0.16)} 74%, transparent 100%)`;
    case 'plasma':
      return `radial-gradient(circle at 72% 30%, ${hexToRgba(palette.accent, 0.22)}, transparent 24%), radial-gradient(circle at 24% 74%, ${hexToRgba(palette.glow, 0.2)}, transparent 28%)`;
    case 'glass':
    default:
      return `linear-gradient(145deg, ${hexToRgba('#FFFFFF', 0.18)}, transparent 30%, ${hexToRgba(palette.glow, 0.12)} 68%, transparent 100%)`;
  }
}

function getThemeBackdrop(theme, palette) {
  switch (theme) {
    case 'broadcast':
      return `radial-gradient(circle at 18% 18%, ${hexToRgba(palette.accent, 0.18)}, transparent 24%), radial-gradient(circle at 82% 24%, ${hexToRgba(palette.primary, 0.16)}, transparent 28%)`;
    case 'editorial':
      return `linear-gradient(135deg, ${hexToRgba(palette.secondary, 0.08)}, transparent 42%), radial-gradient(circle at 72% 70%, ${hexToRgba(palette.glow, 0.12)}, transparent 26%)`;
    case 'aurora':
      return `radial-gradient(circle at 22% 22%, ${hexToRgba(palette.secondary, 0.16)}, transparent 28%), radial-gradient(circle at 78% 28%, ${hexToRgba(palette.glow, 0.18)}, transparent 30%), radial-gradient(circle at 50% 78%, ${hexToRgba(palette.primary, 0.16)}, transparent 36%)`;
    case 'signal':
      return `radial-gradient(circle at 50% 10%, ${hexToRgba(palette.glow, 0.16)}, transparent 22%), linear-gradient(90deg, transparent, ${hexToRgba(palette.accent, 0.08)}, transparent)`;
    case 'ceramic':
      return `radial-gradient(circle at 18% 20%, ${hexToRgba('#FFFFFF', 0.08)}, transparent 24%), radial-gradient(circle at 82% 72%, ${hexToRgba(palette.secondary, 0.1)}, transparent 28%)`;
    case 'luxury':
    default:
      return `radial-gradient(circle at 18% 20%, ${hexToRgba(palette.secondary, 0.14)}, transparent 26%), radial-gradient(circle at 82% 26%, ${hexToRgba(palette.primary, 0.14)}, transparent 28%)`;
  }
}

function getMotionLabel(motion, language) {
  const labels = {
    calm: language === 'en' ? 'calm drift' : '차분한 유영',
    drift: language === 'en' ? 'slow drift' : '느린 유영',
    ceremonial: language === 'en' ? 'ceremonial orbit' : '의식적인 회전',
    broadcast: language === 'en' ? 'broadcast pulse' : '브로드캐스트 펄스',
  };
  return labels[motion] || motion;
}

function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== 'string') return `rgba(255,255,255,${alpha})`;
  const normalized = hex.replace('#', '').trim();
  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return `rgba(255,255,255,${alpha})`;

  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function MiniChart({ data = [], accent = '#8EA7FF' }) {
  const safeData = data.length ? data : [{ label: '', value: 0 }];
  const max = Math.max(...safeData.map((item) => item.value || 0), 1);
  const width = 540;
  const height = 140;
  const stepX = width / Math.max(1, safeData.length - 1);
  const points = safeData.map((item, index) => {
    const x = index * stepX;
    const y = height - ((item.value || 0) / max) * (height - 24) - 12;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 160 }}>
      <defs>
        <linearGradient id={`grad-${accent.replace('#', '')}`} x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.44" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={accent} strokeWidth="3" points={points} />
      {safeData.map((item, index) => {
        const x = index * stepX;
        const y = height - ((item.value || 0) / max) * (height - 24) - 12;
        return (
          <g key={`${item.label}-${index}`}>
            <circle cx={x} cy={y} r="4" fill={accent} />
            <text x={x} y={height - 4} fontSize="10" textAnchor="middle" fill="rgba(220,214,255,.7)">
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function TwoCol({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{children}</div>;
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(123,112,224,.08)' }}>
      <div style={{ color: '#F0EEFF', fontSize: 13 }}>{label}</div>
      <button
        type="button"
        onClick={onChange}
        style={{
          width: 56,
          height: 30,
          borderRadius: 999,
          border: '1px solid rgba(123,112,224,.18)',
          background: checked ? 'rgba(83,74,183,.38)' : 'rgba(8,6,24,.64)',
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: checked ? 29 : 3,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: checked ? '#C4BDFF' : 'rgba(196,189,255,.54)',
            transition: 'left .2s ease',
          }}
        />
      </button>
    </div>
  );
}

function StatusPill({ status, language = 'ko' }) {
  const normalized = normalizeOperationalStatus(status);
  const palette = {
    healthy: {
      background: 'rgba(102,255,178,.14)',
      border: 'rgba(102,255,178,.26)',
      color: '#BDF7D5',
      label: language === 'en' ? 'healthy' : '정상',
    },
    degraded: {
      background: 'rgba(255,107,107,.14)',
      border: 'rgba(255,107,107,.26)',
      color: '#FFB0B0',
      label: language === 'en' ? 'degraded' : '주의',
    },
    unknown: {
      background: 'rgba(255,209,102,.16)',
      border: 'rgba(255,209,102,.22)',
      color: '#FFE09B',
      label: language === 'en' ? 'unknown' : '미확인',
    },
  };
  const tone = palette[normalized] || palette.unknown;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 9px',
        borderRadius: 999,
        background: tone.background,
        border: `1px solid ${tone.border}`,
        color: tone.color,
        fontSize: 10,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {tone.label}
    </span>
  );
}

function FieldLabel({ children }) {
  return (
    <div style={{ fontSize: 10, color: 'rgba(178,170,255,.62)', letterSpacing: '.14em', textTransform: 'uppercase', margin: '12px 0 6px' }}>
      {children}
    </div>
  );
}

function FieldHint({ children }) {
  return (
    <div style={{ fontSize: 11, color: 'rgba(220,214,255,.58)', lineHeight: 1.6, marginTop: 6 }}>
      {children}
    </div>
  );
}

function sharedFieldStyle() {
  return {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid rgba(123,112,224,.16)',
    background: 'rgba(4,2,18,.72)',
    color: '#F0EEFF',
    fontSize: 12,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  };
}

function FieldInput(props) {
  return <input {...props} style={sharedFieldStyle()} />;
}

function FieldTextarea({ rows = 4, ...props }) {
  return <textarea {...props} rows={rows} style={{ ...sharedFieldStyle(), resize: 'vertical', lineHeight: 1.6 }} />;
}

function FieldSelect(props) {
  return <select {...props} style={sharedFieldStyle()} />;
}

function splitCsv(value = '') {
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function safeJson(value) {
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch {
    return '{}';
  }
}

function formatDateTime(value, language = 'ko') {
  const date = asDate(value);
  if (!date) return language === 'en' ? 'Unknown time' : '시간 정보 없음';
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function toDateTimeLocalValue(value) {
  const date = asDate(value);
  if (!date) return '';
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function fromDateTimeLocalValue(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function asDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
