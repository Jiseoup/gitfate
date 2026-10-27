import type { CSSProperties, ReactNode } from 'react';
import { stemElement } from '@/core/ganzhi';
import { ELEMENTS, type Element, type Stem } from '@/core/types';
import { SignIcon } from '@/icons/signs';
import type { T } from '@/i18n/messages';

/** Share cards are rendered by Satori: inline styles only, flexbox only, one text node per block. */
export const CARD_SIZE = { width: 1200, height: 630 } as const;

export const PAPER = '#f7f2e8';
export const PANEL = '#eee5d3';
export const INK = '#1c1917';
export const MUTED = '#78716c';
export const LINE = '#e2d9c6';
export const SEAL = '#b91c1c';
export const LUCK = '#dc2626';
export const COMMITS = '#16a34a';

/** Five-element colors: wood green, fire red, earth yellow, metal white/gray, water black/navy. */
export const ELEMENT_COLOR: Record<Element, { bg: string; fg: string; border: string; stripe: string }> = {
  wood: { bg: '#16a34a', fg: '#ffffff', border: '#15803d', stripe: '#16a34a' },
  fire: { bg: '#dc2626', fg: '#ffffff', border: '#b91c1c', stripe: '#dc2626' },
  earth: { bg: '#facc15', fg: '#1c1917', border: '#eab308', stripe: '#facc15' },
  metal: { bg: '#ffffff', fg: '#57534e', border: '#a8a29e', stripe: '#d6d3d1' },
  water: { bg: '#0f172a', fg: '#ffffff', border: '#0f172a', stripe: '#0f172a' },
};

const row: CSSProperties = { display: 'flex', flexDirection: 'row' };
const col: CSSProperties = { display: 'flex', flexDirection: 'column' };

export function Row({ style, children }: { style?: CSSProperties; children?: ReactNode }) {
  return <div style={{ ...row, ...style }}>{children}</div>;
}

export function Col({ style, children }: { style?: CSSProperties; children?: ReactNode }) {
  return <div style={{ ...col, ...style }}>{children}</div>;
}

/** A single line or paragraph, cut with an ellipsis after `lines`. Korean wraps between words, not syllables. */
export function Text({ lines = 1, style, children }: { lines?: number; style?: CSSProperties; children: string }) {
  return <div style={{ display: 'block', lineClamp: lines, wordBreak: 'keep-all', ...style }}>{children}</div>;
}

/** Page chrome: five-element stripe on top, service name and disclaimer in the footer. */
export function CardFrame({ t, children }: { t: T; children: ReactNode }) {
  const serviceName = t('meta.serviceName');
  return (
    <Col style={{ width: CARD_SIZE.width, height: CARD_SIZE.height, background: PAPER, color: INK, fontFamily: 'Noto Sans KR' }}>
      <Row style={{ height: 10 }}>
        {ELEMENTS.map((e) => (
          <div key={e} style={{ flex: 1, background: ELEMENT_COLOR[e].stripe }} />
        ))}
      </Row>
      <Col style={{ flex: 1, padding: '34px 56px 0' }}>{children}</Col>
      <Row
        style={{
          height: 76,
          margin: '0 56px',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: `2px solid ${LINE}`,
        }}
      >
        <Row style={{ alignItems: 'center', gap: 12 }}>
          <Row
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: SEAL,
              color: '#ffffff',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            {Array.from(serviceName)[0] ?? ''}
          </Row>
          <Text style={{ fontSize: 26, fontWeight: 700 }}>{serviceName}</Text>
        </Row>
        <Text style={{ fontSize: 19, color: MUTED, maxWidth: 820 }}>{t('ui.disclaimer')}</Text>
      </Row>
    </Col>
  );
}

/** A stem's Dev Sign icon on its element color (the icon is language-agnostic). */
export function SignTile({ stem, size }: { stem: Stem; size: number }) {
  const c = ELEMENT_COLOR[stemElement(stem)];
  return (
    <Row
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: Math.round(size * 0.24),
        background: c.bg,
        border: `3px solid ${c.border}`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <SignIcon stem={stem} size={Math.round(size * 0.66)} color={c.fg} />
    </Row>
  );
}

/** A pillar's color-and-animal name as a small outlined chip, e.g. "흰 돼지". */
export function Chip({ children, size = 18 }: { children: string; size?: number }) {
  return (
    <Row
      style={{
        flexShrink: 0,
        padding: `${Math.round(size * 0.18)}px ${Math.round(size * 0.6)}px`,
        borderRadius: 999,
        border: `2px solid ${LINE}`,
        color: MUTED,
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1.15,
      }}
    >
      {children}
    </Row>
  );
}

export function Avatar({ src, login, size }: { src: string | null; login: string; size: number }) {
  const ring = { border: '5px solid #ffffff', boxShadow: '0 6px 18px rgba(28, 25, 23, 0.18)' };
  if (src) {
    // Satori renders plain <img>; next/image does not apply here.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={size} height={size} style={{ borderRadius: size / 2, ...ring }} />;
  }
  return (
    <Row
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: PANEL,
        color: MUTED,
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.42),
        fontWeight: 700,
        ...ring,
      }}
    >
      {login.slice(0, 1).toUpperCase()}
    </Row>
  );
}

/** Section label, e.g. "오늘의 운세". */
export function Pill({ children }: { children: string }) {
  return (
    <Row
      style={{
        padding: '5px 18px',
        borderRadius: 999,
        border: `2px solid ${SEAL}`,
        color: SEAL,
        fontSize: 22,
        fontWeight: 700,
      }}
    >
      {children}
    </Row>
  );
}

/** A small gray tag, e.g. today's role. */
export function Tag({ children, size = 22 }: { children: string; size?: number }) {
  return (
    <Row style={{ padding: '4px 14px', borderRadius: 10, background: PANEL, color: INK, fontSize: size, fontWeight: 700 }}>
      {children}
    </Row>
  );
}

/** Avatar, display name and @login in a row (daily and yearly cards). */
export function PersonHeader({ avatar, name, login, right }: {
  avatar: string | null;
  name: string;
  login: string;
  right: ReactNode;
}) {
  return (
    <Row style={{ alignItems: 'center', gap: 20 }}>
      <Avatar src={avatar} login={login} size={76} />
      <Col style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.2 }}>{name}</Text>
        <Text style={{ fontSize: 22, color: MUTED }}>{`@${login}`}</Text>
      </Col>
      {right}
    </Row>
  );
}
