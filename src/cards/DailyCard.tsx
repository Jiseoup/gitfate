import type { StarKey } from '@/core/daily';
import { formatLongDate } from '@/components/format';
import { pillarName } from '@/components/sign-text';
import { createT, type T } from '@/i18n/messages';
import type { CardThemeName } from '@/lib/card-url';
import type { UserReading } from '@/reading/user';
import { CardFrame, Chip, Col, Pill, PersonHeader, Row, Tag, Text } from './Frame';
import { cardTheme, type CardTheme } from './theme';

type OkReading = Extract<UserReading, { status: 'ok' }>;

const STAR_KEYS: StarKey[] = ['deploy', 'debug', 'review', 'merge'];
const STAR_PATH = 'M12 1.8l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.6l-6.3 3.6 1.5-7.1-5.4-4.9 7.2-.8z';

function Stars({ count, th }: { count: number; th: CardTheme }) {
  return (
    <Row style={{ gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={28} height={28} viewBox="0 0 24 24">
          <path d={STAR_PATH} fill={i <= count ? th.star : th.starOff} />
        </svg>
      ))}
    </Row>
  );
}

/** First 宜 or 忌 item from the almanac, translated into a dev activity. */
function YiJi({ title, item, t, tone, th }: { title: string; item: string | undefined; t: T; tone: string; th: CardTheme }) {
  return (
    <Col style={{ flex: 1, minWidth: 0, gap: 4, padding: '10px 20px', borderRadius: 20, background: th.panel }}>
      <Text style={{ fontSize: 18, fontWeight: 700, color: tone }}>{title}</Text>
      <Text lines={2} style={{ fontSize: 21, fontWeight: 700, lineHeight: 1.3, color: th.ink }}>
        {item ? t(`yiji.${item}`) : '—'}
      </Text>
    </Col>
  );
}

/** Today: date, total luck score, today's role, four star ratings and one 宜 / 忌 each from the almanac. */
export function DailyCard({ r, locale, avatar, theme }: {
  r: OkReading;
  locale: string;
  avatar: string | null;
  theme?: CardThemeName;
}) {
  const t = createT(locale);
  const th = cardTheme(theme);
  const tDaily = createT(locale, r.daily.variantSeed);
  const { daily } = r;
  const login = r.profile.login;
  const name = r.profile.name ?? login;
  return (
    <CardFrame th={th} t={t}>
      <PersonHeader th={th}
        avatar={avatar}
        name={name}
        login={login}
        right={
          <Col style={{ alignItems: 'flex-end', gap: 8 }}>
            <Pill th={th}>{t('ui.section.daily')}</Pill>
            <Text style={{ fontSize: 24, color: th.muted }}>{formatLongDate(locale, daily.date)}</Text>
          </Col>
        }
      />
      <Row style={{ flex: 1, gap: 44, marginTop: 22, paddingBottom: 22 }}>
        <Col style={{ width: 260, justifyContent: 'center', gap: 16 }}>
          <Row style={{ alignItems: 'baseline', gap: 8 }}>
            <Text style={{ fontSize: 148, fontWeight: 700, color: th.luck, lineHeight: 1 }}>{String(daily.score)}</Text>
            <Text style={{ fontSize: 28, color: th.muted }}>/ 100</Text>
          </Row>
          <Row>
            <Chip th={th} size={22}>{pillarName(t, daily.dayPillar)}</Chip>
          </Row>
        </Col>
        <Col style={{ flex: 1, minWidth: 0, justifyContent: 'center', gap: 16 }}>
          <Col style={{ gap: 8 }}>
            <Row style={{ alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 19, color: th.muted, fontWeight: 700 }}>{t('ui.role.today')}</Text>
              <Tag th={th} size={20}>{t(`terms.tenGod.${daily.tenGod}`)}</Tag>
            </Row>
            <Text lines={3} style={{ fontSize: 25, lineHeight: 1.42 }}>
              {tDaily(`daily.tenGod.${daily.tenGod}`, { name })}
            </Text>
          </Col>
          <Row style={{ flexWrap: 'wrap', rowGap: 8, columnGap: 32 }}>
            {STAR_KEYS.map((k) => (
              <Row key={k} style={{ width: 376, alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 22, color: th.ink }}>{t(`ui.stars.${k}`)}</Text>
                <Stars count={daily.stars[k]} th={th} />
              </Row>
            ))}
          </Row>
          <Col style={{ gap: 6 }}>
            <Text style={{ fontSize: 18, color: th.muted, fontWeight: 700 }}>{t('ui.almanac.header')}</Text>
            <Row style={{ gap: 16 }}>
              <YiJi title={t('ui.yiji.do')} item={daily.yi[0]} t={tDaily} tone={th.commits} th={th} />
              <YiJi title={t('ui.yiji.dont')} item={daily.ji[0]} t={tDaily} tone={th.luck} th={th} />
            </Row>
          </Col>
        </Col>
      </Row>
    </CardFrame>
  );
}
