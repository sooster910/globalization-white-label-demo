import { useEffect, useState, type CSSProperties } from "react";
import { brandRegistry } from "./brandRegistry";
import type { DeploymentConfig } from "./deploymentConfig";
import "./App.css";

type Locale = "en-US" | "en-SG" | "ko-KR" | "ja-JP";
type BrandId = DeploymentConfig["brandId"];

const locales: { id: Locale; label: string }[] = [
  { id: "en-US", label: "English (US)" },
  { id: "en-SG", label: "English (SG)" },
  { id: "ko-KR", label: "한국어" },
  { id: "ja-JP", label: "日本語" },
];

const messages = {
  "en-US": {
    workspace: "Demo workspace",
    overview: "Overview",
    patients: "Patients",
    schedule: "Schedule",
    reports: "Reports",
    settings: "Settings",
    eyebrow: "ONE CODEBASE · MULTIPLE DEPLOYMENTS",
    title: "One product, tailored to each market",
    description:
      "Compare two white label previews and local formats. The real deployment values below stay fixed at build time.",
    brandTitle: "Brand preview",
    brandHelp:
      "Preview presentation only. This does not change the deployed brand.",
    localeTitle: "Language preview",
    localeHelp: "See translated copy and locale formatting.",
    previewOnly: "Preview only",
    deployment: "Deployment configuration",
    deploymentHelp:
      "These four values are set by Terraform and validated at startup.",
    deployedBrand: "Brand ID",
    api: "API base URL",
    market: "Market country",
    defaultLocale: "Default locale",
    orgTitle: "Sample organization context",
    orgHelp:
      "Timezone and currency come from organization or server data, independently of locale.",
    timeZone: "Organization timezone",
    currencyCode: "Server currency",
    preview: "Product preview",
    greeting: "Good morning, clinician",
    greetingHelp: "Here is your patient overview for today.",
    activePatients: "Active patients",
    completion: "Exercise completion",
    sessions: "Sessions this month",
    upcoming: "Upcoming appointment",
    appointment: "Initial consultation",
    samplePatient: "Sample patient",
    scheduled: "Scheduled",
    formats: "Local formatting",
    date: "Date",
    time: "Time",
    number: "Number",
    currency: "Amount",
    support: "Support",
    legal: "Legal links",
    note: "Fictional sample data · No real patient information · Brand selection is a preview, not runtime deployment resolution.",
  },
  "en-SG": {
    workspace: "Demo workspace",
    overview: "Overview",
    patients: "Patients",
    schedule: "Schedule",
    reports: "Reports",
    settings: "Settings",
    eyebrow: "ONE CODEBASE · MULTIPLE DEPLOYMENTS",
    title: "One product, tailored to each market",
    description:
      "Compare two white label previews and local formats. The real deployment values below stay fixed at build time.",
    brandTitle: "Brand preview",
    brandHelp:
      "Preview presentation only. This does not change the deployed brand.",
    localeTitle: "Language preview",
    localeHelp: "See translated copy and locale formatting.",
    previewOnly: "Preview only",
    deployment: "Deployment configuration",
    deploymentHelp:
      "These four values are set by Terraform and validated at startup.",
    deployedBrand: "Brand ID",
    api: "API base URL",
    market: "Market country",
    defaultLocale: "Default locale",
    orgTitle: "Sample organisation context",
    orgHelp:
      "Time zone and currency come from organisation or server data, independently of locale.",
    timeZone: "Organisation time zone",
    currencyCode: "Server currency",
    preview: "Product preview",
    greeting: "Good morning, clinician",
    greetingHelp: "Here is your patient overview for today.",
    activePatients: "Active patients",
    completion: "Exercise completion",
    sessions: "Sessions this month",
    upcoming: "Upcoming appointment",
    appointment: "Initial consultation",
    samplePatient: "Sample patient",
    scheduled: "Scheduled",
    formats: "Local formatting",
    date: "Date",
    time: "Time",
    number: "Number",
    currency: "Amount",
    support: "Support",
    legal: "Legal links",
    note: "Fictional sample data · No real patient information · Brand selection is a preview, not runtime deployment resolution.",
  },
  "ko-KR": {
    workspace: "데모 워크스페이스",
    overview: "개요",
    patients: "환자",
    schedule: "일정",
    reports: "리포트",
    settings: "설정",
    eyebrow: "하나의 코드베이스 · 여러 배포 환경",
    title: "시장과 브랜드에 맞는 하나의 제품",
    description:
      "화이트 레이블과 지역별 표시 형식을 비교해 보세요. 실제 배포 설정은 빌드 시점에 고정됩니다.",
    brandTitle: "브랜드 미리보기",
    brandHelp: "화면 표현만 미리 봅니다. 실제 배포 브랜드는 바뀌지 않습니다.",
    localeTitle: "언어 미리보기",
    localeHelp: "번역 문구와 지역별 표시 형식을 확인합니다.",
    previewOnly: "미리보기 전용",
    deployment: "배포 설정",
    deploymentHelp: "네 값은 Terraform에서 설정하고 앱 시작 시 검증합니다.",
    deployedBrand: "브랜드 ID",
    api: "API 기본 URL",
    market: "기본 시장 국가",
    defaultLocale: "기본 언어",
    orgTitle: "샘플 조직 정보",
    orgHelp: "시간대와 통화는 언어와 별개로 조직·서버 데이터에서 가져옵니다.",
    timeZone: "조직 시간대",
    currencyCode: "서버 통화",
    preview: "제품 미리보기",
    greeting: "안녕하세요, 담당자님",
    greetingHelp: "오늘의 환자 현황을 확인해 보세요.",
    activePatients: "관리 중인 환자",
    completion: "운동 완료율",
    sessions: "이번 달 세션",
    upcoming: "예정된 일정",
    appointment: "초기 상담",
    samplePatient: "샘플 환자",
    scheduled: "예정",
    formats: "지역별 형식",
    date: "날짜",
    time: "시간",
    number: "숫자",
    currency: "금액",
    support: "고객 지원",
    legal: "약관·개인정보 링크",
    note: "가상 데이터 · 실제 환자 정보 없음 · 브랜드 선택은 미리보기이며 배포 브랜드를 바꾸지 않습니다.",
  },
  "ja-JP": {
    workspace: "デモワークスペース",
    overview: "概要",
    patients: "患者",
    schedule: "予定",
    reports: "レポート",
    settings: "設定",
    eyebrow: "ひとつのコードベース · 複数のデプロイ",
    title: "市場とブランドに合う、ひとつの製品",
    description:
      "ホワイトラベルと地域別の表示形式を比較できます。実際のデプロイ設定はビルド時に固定されます。",
    brandTitle: "ブランドプレビュー",
    brandHelp: "表示だけを確認します。デプロイ中のブランドは変わりません。",
    localeTitle: "言語プレビュー",
    localeHelp: "翻訳と地域別の表示形式を確認します。",
    previewOnly: "プレビューのみ",
    deployment: "デプロイ設定",
    deploymentHelp: "4つの値はTerraformで設定し、起動時に検証します。",
    deployedBrand: "ブランドID",
    api: "APIベースURL",
    market: "市場の国",
    defaultLocale: "既定の言語",
    orgTitle: "サンプル組織情報",
    orgHelp:
      "タイムゾーンと通貨は言語と別に組織・サーバーデータから取得します。",
    timeZone: "組織のタイムゾーン",
    currencyCode: "サーバー通貨",
    preview: "製品プレビュー",
    greeting: "こんにちは、担当者様",
    greetingHelp: "本日の患者の状況をご確認ください。",
    activePatients: "担当患者数",
    completion: "運動完了率",
    sessions: "今月のセッション",
    upcoming: "今後の予定",
    appointment: "初回相談",
    samplePatient: "サンプル患者",
    scheduled: "予定",
    formats: "地域別の表示",
    date: "日付",
    time: "時刻",
    number: "数値",
    currency: "金額",
    support: "サポート",
    legal: "利用規約・プライバシー",
    note: "架空のデータ · 実際の患者情報はありません · ブランド選択はプレビューのみです。",
  },
} satisfies Record<Locale, Record<string, string>>;

const sampleDate = new Date("2026-10-15T03:30:00Z");
const sampleAmount = 1234.5;

export default function App({
  deploymentConfig,
}: {
  deploymentConfig: DeploymentConfig;
}) {
  const [previewBrandId, setPreviewBrandId] = useState<BrandId>(
    deploymentConfig.brandId,
  );
  const [locale, setLocale] = useState<Locale>(
    deploymentConfig.defaults.locale,
  );
  const [organizationTimeZone, setOrganizationTimeZone] =
    useState("Asia/Singapore");
  const [serverCurrency, setServerCurrency] = useState("USD");
  const brand = brandRegistry[previewBrandId];
  const t = messages[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: organizationTimeZone,
  }).format(sampleDate);
  const time = new Intl.DateTimeFormat(locale, {
    timeStyle: "short",
    timeZone: organizationTimeZone,
  }).format(sampleDate);
  const number = new Intl.NumberFormat(locale).format(1284);
  const percent = new Intl.NumberFormat(locale, { style: "percent" }).format(
    0.82,
  );
  const amount = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: serverCurrency,
    currencyDisplay: "code",
  }).format(sampleAmount);
  const style = {
    "--brand": brand.theme.primary,
    "--brand-soft": brand.theme.secondary,
  } as CSSProperties;

  return (
    <div className="app-shell" style={style}>
      <aside className="sidebar">
        <div className="brand-lockup">
          <img src={brand.logoUrl} alt={brand.displayName} />
        </div>
        <div className="workspace">
          <span className="workspace-icon">✦</span>
          {t.workspace}
          <span className="chevron">⌄</span>
        </div>
        <nav aria-label={t.workspace}>
          <span className="nav-label">WORKSPACE</span>
          <span className="nav-item selected">
            ◫ <span>{t.overview}</span>
          </span>
          <span className="nav-item">
            ♧ <span>{t.patients}</span>
          </span>
          <span className="nav-item">
            ▦ <span>{t.schedule}</span>
          </span>
          <span className="nav-item">
            ▤ <span>{t.reports}</span>
          </span>
          <span className="nav-item">
            ⚙ <span>{t.settings}</span>
          </span>
        </nav>
        <div className="sidebar-foot">
          <span className="online-dot" /> DEMO MODE
          <small>Vite · React · TypeScript</small>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            {t.workspace} <span>/</span> <strong>{t.overview}</strong>
          </div>
          <span className="avatar">DEMO</span>
        </header>
        <div className="page">
          <section className="hero">
            <div className="hero-copy">
              <span className="eyebrow">
                <span className="online-dot" />
                {t.eyebrow}
              </span>
              <h1>{t.title}</h1>
              <p>{t.description}</p>
            </div>
            <div className="hero-orbit" aria-hidden="true">
              <div className="orbit-inner">✦</div>
              <span className="orbit-pin pin-one">US</span>
              <span className="orbit-pin pin-two">SG</span>
            </div>
          </section>
          <div className="control-grid">
            <section className="control-card">
              <div className="card-head">
                <span className="step">01 / BRAND</span>
                <h2>
                  {t.brandTitle}{" "}
                  <small className="preview-tag">{t.previewOnly}</small>
                </h2>
                <p>{t.brandHelp}</p>
              </div>
              <div
                className="brand-options"
                role="group"
                aria-label={t.brandTitle}
              >
                {(Object.keys(brandRegistry) as BrandId[]).map((id) => (
                  <button
                    type="button"
                    key={id}
                    className={
                      previewBrandId === id
                        ? "brand-option active"
                        : "brand-option"
                    }
                    aria-pressed={previewBrandId === id}
                    onClick={() => setPreviewBrandId(id)}
                  >
                    <span
                      className="brand-swatch"
                      style={{ background: brandRegistry[id].theme.primary }}
                    >
                      {brandRegistry[id].mark}
                    </span>
                    <span>{brandRegistry[id].displayName}</span>
                  </button>
                ))}
              </div>
            </section>
            <section className="control-card">
              <div className="card-head">
                <span className="step">02 / LOCALE</span>
                <h2>{t.localeTitle}</h2>
                <p>{t.localeHelp}</p>
              </div>
              <div
                className="locale-options"
                role="group"
                aria-label={t.localeTitle}
              >
                {locales.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={
                      locale === item.id
                        ? "locale-option active"
                        : "locale-option"
                    }
                    aria-pressed={locale === item.id}
                    onClick={() => setLocale(item.id)}
                  >
                    <strong>{item.label}</strong>
                  </button>
                ))}
              </div>
            </section>
          </div>
          <section className="configuration">
            <div className="card-head">
              <span className="step">03 / DEPLOYMENT</span>
              <h2>{t.deployment}</h2>
              <p>{t.deploymentHelp}</p>
            </div>
            <dl>
              <div>
                <dt>{t.deployedBrand}</dt>
                <dd>{deploymentConfig.brandId}</dd>
              </div>
              <div>
                <dt>{t.api}</dt>
                <dd>{deploymentConfig.apiBaseUrl}</dd>
              </div>
              <div>
                <dt>{t.market}</dt>
                <dd>{deploymentConfig.market.countryCode}</dd>
              </div>
              <div>
                <dt>{t.defaultLocale}</dt>
                <dd>{deploymentConfig.defaults.locale}</dd>
              </div>
            </dl>
          </section>
          <section className="configuration org-context">
            <div className="card-head">
              <span className="step">04 / ORGANIZATION</span>
              <h2>{t.orgTitle}</h2>
              <p>{t.orgHelp}</p>
            </div>
            <div className="org-fields">
              <label>
                {t.timeZone}
                <select
                  value={organizationTimeZone}
                  onChange={(event) =>
                    setOrganizationTimeZone(event.target.value)
                  }
                >
                  <option value="Asia/Singapore">Asia/Singapore</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                  <option value="Asia/Seoul">Asia/Seoul</option>
                </select>
              </label>
              <label>
                {t.currencyCode}
                <select
                  value={serverCurrency}
                  onChange={(event) => setServerCurrency(event.target.value)}
                >
                  <option value="USD">USD</option>
                  <option value="SGD">SGD</option>
                  <option value="JPY">JPY</option>
                  <option value="KRW">KRW</option>
                </select>
              </label>
            </div>
          </section>
          <section className="preview-section">
            <div className="preview-heading">
              <div>
                <span className="step">05 / PREVIEW</span>
                <h2>{t.preview}</h2>
              </div>
              <span className="preview-domain">◉ {t.previewOnly}</span>
            </div>
            <div className="preview-surface">
              <div className="preview-welcome">
                <div>
                  <span className="preview-kicker">
                    {brand.displayName.toUpperCase()} / OVERVIEW
                  </span>
                  <h3>{t.greeting}</h3>
                  <p>{t.greetingHelp}</p>
                </div>
                <span className="preview-badge">{locale}</span>
              </div>
              <div className="metrics">
                <article>
                  <span className="metric-icon blue">♧</span>
                  <small>{t.activePatients}</small>
                  <strong>{number}</strong>
                  <em>↗ 12.4%</em>
                </article>
                <article>
                  <span className="metric-icon green">✓</span>
                  <small>{t.completion}</small>
                  <strong>{percent}</strong>
                  <em>↗ 5.2%</em>
                </article>
                <article>
                  <span className="metric-icon purple">▤</span>
                  <small>{t.sessions}</small>
                  <strong>{new Intl.NumberFormat(locale).format(348)}</strong>
                  <em>↗ 8.1%</em>
                </article>
              </div>
              <div className="detail-grid">
                <div className="detail-card">
                  <h4>{t.upcoming}</h4>
                  <div className="appointment">
                    <span className="calendar-tile">
                      <strong>
                        {new Intl.DateTimeFormat(locale, {
                          day: "2-digit",
                          timeZone: organizationTimeZone,
                        }).format(sampleDate)}
                      </strong>
                      <small>
                        {new Intl.DateTimeFormat(locale, {
                          month: "short",
                          timeZone: organizationTimeZone,
                        }).format(sampleDate)}
                      </small>
                    </span>
                    <span className="appointment-text">
                      <strong>{t.appointment}</strong>
                      <small>
                        {t.samplePatient} · {time}
                      </small>
                    </span>
                    <span className="status">{t.scheduled}</span>
                  </div>
                </div>
                <div className="detail-card">
                  <h4>{t.formats}</h4>
                  <dl>
                    <div>
                      <dt>{t.date}</dt>
                      <dd>{date}</dd>
                    </div>
                    <div>
                      <dt>{t.time}</dt>
                      <dd>{time}</dd>
                    </div>
                    <div>
                      <dt>{t.number}</dt>
                      <dd>{number}</dd>
                    </div>
                    <div>
                      <dt>{t.currency}</dt>
                      <dd>{amount}</dd>
                    </div>
                    <div>
                      <dt>{t.timeZone}</dt>
                      <dd>{organizationTimeZone}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <div className="brand-meta">
                <span>
                  {t.support}: {brand.supportEmail}
                </span>
                <span>
                  {t.legal}: {brand.termsUrl} · {brand.privacyUrl}
                </span>
              </div>
            </div>
          </section>
          <footer>{t.note}</footer>
        </div>
      </main>
    </div>
  );
}
