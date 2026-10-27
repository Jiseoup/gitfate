import { formatLongDate, fullYears } from '@/components/format';
import { pillarName } from '@/components/sign-text';
import type { Pillar } from '@/core/types';
import { createT, type T } from '@/i18n/messages';
import type { UserReading } from '@/reading/user';
import { Avatar, CardFrame, Col, ELEMENT_COLOR, INK, MUTED, PANEL, Pill, Row, SignTile, Text } from './Frame';

type OkReading = Extract<UserReading, { status: 'ok' }>;

const ORDER = ['hour', 'day', 'month', 'year'] as const;

/** One pillar: its stem's Sign icon and name, with its color-and-animal name below. */
function PillarCell({ label, pillar, highlight, t }: { label: string; pillar: Pillar; highlight: boolean; t: T }) {
  return (
    <Col
      style={{
        flex: 1,
        minWidth: 0,
        alignItems: 'center',
        gap: 8,
        padding: '12px 0 14px',
        borderRadius: 22,
        background: highlight ? PANEL : 'transparent',
      }}
    >
      <Text style={{ fontSize: 18, color: MUTED, fontWeight: 700 }}>{label}</Text>
      <SignTile stem={pillar.stem} size={64} />
      <Text style={{ fontSize: 22, fontWeight: 700, maxWidth: 160 }}>{t(`terms.sign.${pillar.stem}`)}</Text>
      <Text style={{ fontSize: 17, color: MUTED, fontWeight: 700, maxWidth: 160 }}>{pillarName(t, pillar)}</Text>
    </Col>
  );
}

/** Birth chart: who and when they joined, their Dev Sign ("Ji is The Jewel"), zodiac, and the four pillars as Signs. */
export function NatalCard({ r, locale, avatar }: { r: OkReading; locale: string; avatar: string | null }) {
  const t = createT(locale);
  const login = r.profile.login;
  const tNatal = createT(locale, `${login.toLowerCase()}|natal`);
  const { chart } = r;
  const dm = chart.dayMaster;
  const name = r.profile.name ?? login;
  const zodiac = `${t(`terms.zodiacColor.${chart.zodiac.element}`)} ${t(`terms.zodiac.${chart.zodiac.animal}`)}`;
  return (
    <CardFrame t={t}>
      <Row style={{ flex: 1, gap: 44, paddingBottom: 24 }}>
        <Col style={{ width: 330, justifyContent: 'center', alignItems: 'flex-start' }}>
          <Pill>{t('ui.section.natal')}</Pill>
          <Row style={{ marginTop: 26 }}>
            <Avatar src={avatar} login={login} size={148} />
          </Row>
          <Text lines={2} style={{ marginTop: 18, fontSize: 40, fontWeight: 700, lineHeight: 1.2 }}>
            {name}
          </Text>
          <Text style={{ marginTop: 4, fontSize: 24, color: MUTED }}>{`@${login}`}</Text>
          {/* Two lines: "Joined September 3, 2011 · GitHub age 15" does not fit the column in English. */}
          <Text style={{ marginTop: 6, fontSize: 19, color: MUTED }}>
            {t('ui.joined', { date: formatLongDate(locale, r.bornAt.slice(0, 10)) })}
          </Text>
          <Text style={{ fontSize: 19, color: MUTED }}>
            {t('ui.githubAge', { age: fullYears(r.bornAt.slice(0, 10), r.daily.date) })}
          </Text>
          <Row style={{ marginTop: 18, alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                background: ELEMENT_COLOR[chart.zodiac.element].bg,
                border: `2px solid ${ELEMENT_COLOR[chart.zodiac.element].border}`,
              }}
            />
            <Text style={{ fontSize: 26, fontWeight: 700 }}>{zodiac}</Text>
          </Row>
        </Col>
        <Col style={{ flex: 1, minWidth: 0, justifyContent: 'center', gap: 22 }}>
          <Row style={{ alignItems: 'center', gap: 26 }}>
            <SignTile stem={dm} size={136} />
            <Col style={{ flex: 1, minWidth: 0, alignItems: 'flex-start', gap: 6 }}>
              <Text lines={2} style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.18 }}>
                {t('natal.headline', { name, sign: t(`terms.sign.${dm}`) })}
              </Text>
              <Text lines={2} style={{ fontSize: 25, lineHeight: 1.35, color: INK }}>
                {tNatal(`natal.archetype.${dm}.name`)}
              </Text>
            </Col>
          </Row>
          <Row style={{ gap: 8 }}>
            {ORDER.map((k) => (
              <PillarCell key={k} label={t(`terms.pillar.${k}`)} pillar={chart.pillars[k]} highlight={k === 'day'} t={t} />
            ))}
          </Row>
        </Col>
      </Row>
    </CardFrame>
  );
}
