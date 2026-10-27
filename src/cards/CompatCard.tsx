import { compatFlowText, displayName } from '@/components/compat-text';
import { formatLongDate } from '@/components/format';
import { localDateKey } from '@/core/time';
import { createT, type T } from '@/i18n/messages';
import type { CompatReading, CompatSide } from '@/reading/compat';
import { Avatar, CardFrame, Col, LUCK, MUTED, PANEL, Pill, Row, SignTile, Text } from './Frame';

type OkReading = Extract<CompatReading, { status: 'ok' }>;

function Person({ side, avatar, t, locale }: { side: CompatSide; avatar: string | null; t: T; locale: string }) {
  const { profile, chart } = side;
  return (
    <Col style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
      <Avatar src={avatar} login={profile.login} size={108} />
      <Text style={{ marginTop: 12, maxWidth: 380, fontSize: 34, fontWeight: 700, lineHeight: 1.2 }}>{displayName(side)}</Text>
      <Text style={{ fontSize: 22, color: MUTED }}>{`@${profile.login}`}</Text>
      <Text style={{ fontSize: 18, color: MUTED }}>
        {t('ui.joined', { date: formatLongDate(locale, localDateKey(new Date(profile.createdAt), side.tz.tz)) })}
      </Text>
      <Row style={{ marginTop: 12, width: 360, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <SignTile stem={chart.dayMaster} size={60} />
        <Col style={{ flexShrink: 1, minWidth: 0, gap: 2 }}>
          <Text style={{ fontSize: 24, fontWeight: 700 }}>{t(`terms.sign.${chart.dayMaster}`)}</Text>
          {/* Always two lines tall, so both people line up even when only one one-liner wraps. */}
          <Text lines={2} style={{ minHeight: 47, fontSize: 18, lineHeight: 1.3 }}>
            {t(`natal.archetype.${chart.dayMaster}.name`)}
          </Text>
        </Col>
      </Row>
    </Col>
  );
}

/** Two developers: avatars, the compatibility score and who writes / who reviews. */
export function CompatCard({ r, locale, avatars }: {
  r: OkReading;
  locale: string;
  avatars: [string | null, string | null];
}) {
  const t = createT(locale);
  return (
    <CardFrame t={t}>
      <Row style={{ justifyContent: 'center' }}>
        <Pill>{t('ui.section.compat')}</Pill>
      </Row>
      <Row style={{ flex: 1, alignItems: 'center', marginTop: 8 }}>
        <Person side={r.a} avatar={avatars[0]} t={t} locale={locale} />
        <Col style={{ width: 250, alignItems: 'center' }}>
          <Text style={{ fontSize: 30, color: MUTED }}>×</Text>
          <Text style={{ fontSize: 132, fontWeight: 700, color: LUCK, lineHeight: 1 }}>{String(r.result.score)}</Text>
          <Text style={{ fontSize: 24, color: MUTED }}>/ 100</Text>
        </Col>
        <Person side={r.b} avatar={avatars[1]} t={t} locale={locale} />
      </Row>
      <Row style={{ marginBottom: 22, padding: '16px 28px', borderRadius: 22, background: PANEL, justifyContent: 'center' }}>
        <Text lines={2} style={{ fontSize: 24, lineHeight: 1.45, textAlign: 'center' }}>
          {compatFlowText(locale, r.a, r.b, r.result)}
        </Text>
      </Row>
    </CardFrame>
  );
}
