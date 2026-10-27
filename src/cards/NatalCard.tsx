import { formatLongDate, fullYears } from '@/components/format';
import { pillarName } from '@/components/sign-text';
import type { Pillar } from '@/core/types';
import { createT, type T } from '@/i18n/messages';
import type { CardThemeName } from '@/lib/card-url';
import type { UserReading } from '@/reading/user';
import { Avatar, CardFrame, Col, Pill, Row, SignTile, Text } from './Frame';
import { cardTheme, type CardTheme } from './theme';

type OkReading = Extract<UserReading, { status: 'ok' }>;

const ORDER = ['hour', 'day', 'month', 'year'] as const;

/** One pillar: its stem's Sign icon and name, with its color-and-animal name below. */
function PillarCell({ label, pillar, highlight, t, th }: {
  label: string;
  pillar: Pillar;
  highlight: boolean;
  t: T;
  th: CardTheme;
}) {
  return (
    <Col
      style={{
        flex: 1,
        minWidth: 0,
        alignItems: 'center',
        gap: 8,
        padding: '12px 0 14px',
        borderRadius: 22,
        background: highlight ? th.panel : 'transparent',
      }}
    >
      <Text style={{ fontSize: 18, color: th.muted, fontWeight: 700 }}>{label}</Text>
      <SignTile th={th} stem={pillar.stem} size={64} />
      <Text style={{ fontSize: 22, fontWeight: 700, maxWidth: 160 }}>{t(`terms.sign.${pillar.stem}`)}</Text>
      <Text style={{ fontSize: 17, color: th.muted, fontWeight: 700, maxWidth: 160 }}>{pillarName(t, pillar)}</Text>
    </Col>
  );
}

/** Birth chart: who and when they joined, their Dev Sign ("Ji is The Jewel"), zodiac, and the four pillars as Signs. */
export function NatalCard({ r, locale, avatar, theme }: {
  r: OkReading;
  locale: string;
  avatar: string | null;
  theme?: CardThemeName;
}) {
  const t = createT(locale);
  const th = cardTheme(theme);
  const login = r.profile.login;
  const tNatal = createT(locale, `${login.toLowerCase()}|natal`);
  const { chart } = r;
  const dm = chart.dayMaster;
  const name = r.profile.name ?? login;
  const zodiac = `${t(`terms.zodiacColor.${chart.zodiac.element}`)} ${t(`terms.zodiac.${chart.zodiac.animal}`)}`;
  return (
    <CardFrame th={th} t={t}>
      <Row style={{ flex: 1, gap: 44, paddingBottom: 24 }}>
        <Col style={{ width: 330, justifyContent: 'center', alignItems: 'flex-start' }}>
          <Pill th={th}>{t('ui.section.natal')}</Pill>
          <Row style={{ marginTop: 26 }}>
            <Avatar th={th} src={avatar} login={login} size={148} />
          </Row>
          <Text lines={2} style={{ marginTop: 18, fontSize: 40, fontWeight: 700, lineHeight: 1.2 }}>
            {name}
          </Text>
          <Text style={{ marginTop: 4, fontSize: 24, color: th.muted }}>{`@${login}`}</Text>
          {/* Two lines: "Joined September 3, 2011 · GitHub age 15" does not fit the column in English. */}
          <Text style={{ marginTop: 6, fontSize: 19, color: th.muted }}>
            {t('ui.joined', { date: formatLongDate(locale, r.bornAt.slice(0, 10)) })}
          </Text>
          <Text style={{ fontSize: 19, color: th.muted }}>
            {t('ui.githubAge', { age: fullYears(r.bornAt.slice(0, 10), r.daily.date) })}
          </Text>
          <Row style={{ marginTop: 18, alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                background: th.element[chart.zodiac.element].bg,
                border: `2px solid ${th.element[chart.zodiac.element].border}`,
              }}
            />
            <Text style={{ fontSize: 26, fontWeight: 700 }}>{zodiac}</Text>
          </Row>
        </Col>
        <Col style={{ flex: 1, minWidth: 0, justifyContent: 'center', gap: 22 }}>
          <Row style={{ alignItems: 'center', gap: 26 }}>
            <SignTile th={th} stem={dm} size={136} />
            <Col style={{ flex: 1, minWidth: 0, alignItems: 'flex-start', gap: 6 }}>
              <Text lines={2} style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.18 }}>
                {t('natal.headline', { name, sign: t(`terms.sign.${dm}`) })}
              </Text>
              <Text lines={2} style={{ fontSize: 25, lineHeight: 1.35, color: th.ink }}>
                {tNatal(`natal.archetype.${dm}.name`)}
              </Text>
            </Col>
          </Row>
          <Row style={{ gap: 8 }}>
            {ORDER.map((k) => (
              <PillarCell key={k} label={t(`terms.pillar.${k}`)} pillar={chart.pillars[k]} highlight={k === 'day'} t={t} th={th} />
            ))}
          </Row>
        </Col>
      </Row>
    </CardFrame>
  );
}
