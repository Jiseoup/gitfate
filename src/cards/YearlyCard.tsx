import { formatMonthShort, formatShortDay } from '@/components/format';
import { pillarName } from '@/components/sign-text';
import { createT } from '@/i18n/messages';
import type { UserReading } from '@/reading/user';
import { CardFrame, Chip, Col, COMMITS, INK, LINE, LUCK, MUTED, Pill, PersonHeader, Row, SignTile, Tag, Text } from './Frame';

type OkReading = Extract<UserReading, { status: 'ok' }>;

const BAR_MAX = 118;

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Row style={{ alignItems: 'center', gap: 8 }}>
      <div style={{ width: 22, height: 10, borderRadius: 5, background: color }} />
      <Text style={{ fontSize: 18, color: MUTED }}>{label}</Text>
    </Row>
  );
}

/** This saju year: its Sign, this year's role, the theme line and monthly luck bars (plus real contributions when known). */
export function YearlyCard({ r, locale, avatar }: { r: OkReading; locale: string; avatar: string | null }) {
  const t = createT(locale);
  const login = r.profile.login;
  const { yearly } = r;
  const tYearly = createT(locale, `${login.toLowerCase()}|${yearly.year.startYear}`);
  const { pillar } = yearly.year;
  const monthly = r.activity?.monthly ?? null;
  // Organizations have no contribution calendar: every month is null, so only luck bars are drawn.
  const actual = monthly?.some((n) => n !== null) ? monthly : null;
  const maxActual = Math.max(1, ...(actual ?? []).map((n) => n ?? 0));
  const today = r.daily.date;
  return (
    <CardFrame t={t}>
      <PersonHeader
        avatar={avatar}
        name={r.profile.name ?? login}
        login={login}
        right={<Pill>{t('ui.section.yearly')}</Pill>}
      />
      <Row style={{ marginTop: 22, alignItems: 'center', gap: 22 }}>
        <SignTile stem={pillar.stem} size={84} />
        <Col style={{ flex: 1, minWidth: 0, gap: 8 }}>
          <Row style={{ alignItems: 'center', gap: 14 }}>
            <Text style={{ flexShrink: 1, fontSize: 32, fontWeight: 700 }}>
              {t('yearly.title', {
                year: yearly.year.startYear,
                sign: t(`terms.sign.${pillar.stem}`),
                start: formatShortDay(locale, yearly.months[0].startDate),
              })}
            </Text>
            <Chip size={20}>{pillarName(t, pillar)}</Chip>
          </Row>
          <Row style={{ alignItems: 'flex-start', gap: 14 }}>
            <Col style={{ alignItems: 'flex-start', gap: 4 }}>
              <Text style={{ fontSize: 16, color: MUTED, fontWeight: 700 }}>{t('ui.role.year')}</Text>
              <Tag size={19}>{t(`terms.tenGod.${yearly.tenGod}`)}</Tag>
            </Col>
            <Text lines={2} style={{ flex: 1, fontSize: 22, lineHeight: 1.4 }}>
              {tYearly(`yearly.theme.${yearly.tenGod}`)}
            </Text>
          </Row>
        </Col>
      </Row>
      <Col style={{ flex: 1, marginTop: 14, paddingBottom: 14, justifyContent: 'flex-end' }}>
        <Row style={{ justifyContent: 'flex-end', gap: 20, marginBottom: 4 }}>
          <Legend color={LUCK} label={t('ui.chart.luck')} />
          {actual && <Legend color={COMMITS} label={t('ui.chart.commits')} />}
        </Row>
        <Row style={{ borderBottom: `2px solid ${LINE}` }}>
          {yearly.months.map((m, i) => {
            const count = actual?.[i] ?? null;
            const current = m.startDate <= today && today < m.endDate;
            return (
              <Col key={m.index} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: BAR_MAX + 26 }}>
                <Text style={{ fontSize: 16, color: current ? INK : MUTED, fontWeight: current ? 700 : 400 }}>
                  {String(m.score)}
                </Text>
                <Row style={{ alignItems: 'flex-end', gap: 4, marginTop: 4 }}>
                  <div
                    style={{
                      width: 34,
                      height: Math.max(4, Math.round((m.score / 100) * BAR_MAX)),
                      borderRadius: '8px 8px 0 0',
                      background: LUCK,
                      opacity: current ? 1 : 0.78,
                    }}
                  />
                  {count !== null && (
                    <div
                      style={{
                        width: 14,
                        height: Math.max(3, Math.round((count / maxActual) * BAR_MAX)),
                        borderRadius: '6px 6px 0 0',
                        background: COMMITS,
                      }}
                    />
                  )}
                </Row>
              </Col>
            );
          })}
        </Row>
        <Row style={{ marginTop: 6 }}>
          {yearly.months.map((m) => {
            const current = m.startDate <= today && today < m.endDate;
            return (
              <Col key={m.index} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 19, fontWeight: 700, color: current ? LUCK : INK }}>
                  {formatMonthShort(locale, m.labelMonth)}
                </Text>
              </Col>
            );
          })}
        </Row>
      </Col>
    </CardFrame>
  );
}
