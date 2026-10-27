import type { StarKey } from '@/core/daily';
import { formatLongDate } from '@/components/format';
import { pillarName } from '@/components/sign-text';
import { createT, type T } from '@/i18n/messages';
import type { UserReading } from '@/reading/user';
import { CardFrame, Chip, Col, COMMITS, INK, LUCK, MUTED, PANEL, Pill, PersonHeader, Row, Tag, Text } from './Frame';

type OkReading = Extract<UserReading, { status: 'ok' }>;

const STAR_KEYS: StarKey[] = ['deploy', 'debug', 'review', 'merge'];
const STAR_PATH = 'M12 1.8l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.6l-6.3 3.6 1.5-7.1-5.4-4.9 7.2-.8z';

function Stars({ count }: { count: number }) {
  return (
    <Row style={{ gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={28} height={28} viewBox="0 0 24 24">
          <path d={STAR_PATH} fill={i <= count ? '#f59e0b' : '#d6d3d1'} />
        </svg>
      ))}
    </Row>
  );
}

/** First 宜 or 忌 item from the almanac, translated into a dev activity. */
function YiJi({ title, item, t, tone }: { title: string; item: string | undefined; t: T; tone: string }) {
  return (
    <Col style={{ flex: 1, minWidth: 0, gap: 4, padding: '10px 20px', borderRadius: 20, background: PANEL }}>
      <Text style={{ fontSize: 18, fontWeight: 700, color: tone }}>{title}</Text>
      <Text lines={2} style={{ fontSize: 21, fontWeight: 700, lineHeight: 1.3, color: INK }}>
        {item ? t(`yiji.${item}`) : '—'}
      </Text>
    </Col>
  );
}

/** Today: date, total luck score, today's role, four star ratings and one 宜 / 忌 each from the almanac. */
export function DailyCard({ r, locale, avatar }: { r: OkReading; locale: string; avatar: string | null }) {
  const t = createT(locale);
  const tDaily = createT(locale, r.daily.variantSeed);
  const { daily } = r;
  const login = r.profile.login;
  const name = r.profile.name ?? login;
  return (
    <CardFrame t={t}>
      <PersonHeader
        avatar={avatar}
        name={name}
        login={login}
        right={
          <Col style={{ alignItems: 'flex-end', gap: 8 }}>
            <Pill>{t('ui.section.daily')}</Pill>
            <Text style={{ fontSize: 24, color: MUTED }}>{formatLongDate(locale, daily.date)}</Text>
          </Col>
        }
      />
      <Row style={{ flex: 1, gap: 44, marginTop: 22, paddingBottom: 22 }}>
        <Col style={{ width: 260, justifyContent: 'center', gap: 16 }}>
          <Row style={{ alignItems: 'baseline', gap: 8 }}>
            <Text style={{ fontSize: 148, fontWeight: 700, color: LUCK, lineHeight: 1 }}>{String(daily.score)}</Text>
            <Text style={{ fontSize: 28, color: MUTED }}>/ 100</Text>
          </Row>
          <Row>
            <Chip size={22}>{pillarName(t, daily.dayPillar)}</Chip>
          </Row>
        </Col>
        <Col style={{ flex: 1, minWidth: 0, justifyContent: 'center', gap: 16 }}>
          <Col style={{ gap: 8 }}>
            <Row style={{ alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 19, color: MUTED, fontWeight: 700 }}>{t('ui.role.today')}</Text>
              <Tag size={20}>{t(`terms.tenGod.${daily.tenGod}`)}</Tag>
            </Row>
            <Text lines={3} style={{ fontSize: 25, lineHeight: 1.42 }}>
              {tDaily(`daily.tenGod.${daily.tenGod}`, { name })}
            </Text>
          </Col>
          <Row style={{ flexWrap: 'wrap', rowGap: 8, columnGap: 32 }}>
            {STAR_KEYS.map((k) => (
              <Row key={k} style={{ width: 376, alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 22, color: INK }}>{t(`ui.stars.${k}`)}</Text>
                <Stars count={daily.stars[k]} />
              </Row>
            ))}
          </Row>
          <Col style={{ gap: 6 }}>
            <Text style={{ fontSize: 18, color: MUTED, fontWeight: 700 }}>{t('ui.almanac.header')}</Text>
            <Row style={{ gap: 16 }}>
              <YiJi title={t('ui.yiji.do')} item={daily.yi[0]} t={tDaily} tone={COMMITS} />
              <YiJi title={t('ui.yiji.dont')} item={daily.ji[0]} t={tDaily} tone={LUCK} />
            </Row>
          </Col>
        </Col>
      </Row>
    </CardFrame>
  );
}
