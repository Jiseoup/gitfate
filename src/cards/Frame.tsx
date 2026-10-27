import type { CSSProperties, ReactNode } from 'react';
import { stemElement } from '@/core/ganzhi';
import { ELEMENTS, type Stem } from '@/core/types';
import { SignIcon } from '@/icons/signs';
import type { T } from '@/i18n/messages';
import type { CardTheme } from './theme';

/** Share cards are rendered by Satori: inline styles only, flexbox only, one text node per block. */
export const CARD_SIZE = { width: 1200, height: 630 } as const;

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
export function CardFrame({ t, th, children }: { t: T; th: CardTheme; children: ReactNode }) {
  const serviceName = t('meta.serviceName');
  return (
    <Col style={{ width: CARD_SIZE.width, height: CARD_SIZE.height, background: th.paper, color: th.ink, fontFamily: 'Noto Sans KR' }}>
      <Row style={{ height: 10 }}>
        {ELEMENTS.map((e) => (
          <div key={e} style={{ flex: 1, background: th.element[e].stripe }} />
        ))}
      </Row>
      <Col style={{ flex: 1, padding: '34px 56px 0' }}>{children}</Col>
      <Row
        style={{
          height: 76,
          margin: '0 56px',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: `2px solid ${th.line}`,
        }}
      >
        <Row style={{ alignItems: 'center', gap: 12 }}>
          <Row
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: th.seal,
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
        <Text style={{ fontSize: 19, color: th.muted, maxWidth: 820 }}>{t('ui.disclaimer')}</Text>
      </Row>
    </Col>
  );
}

/** A stem's Dev Sign icon on its element color (the icon is language-agnostic). */
export function SignTile({ stem, size, th }: { stem: Stem; size: number; th: CardTheme }) {
  const c = th.element[stemElement(stem)];
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
export function Chip({ children, size = 18, th }: { children: string; size?: number; th: CardTheme }) {
  return (
    <Row
      style={{
        flexShrink: 0,
        padding: `${Math.round(size * 0.18)}px ${Math.round(size * 0.6)}px`,
        borderRadius: 999,
        border: `2px solid ${th.line}`,
        color: th.muted,
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1.15,
      }}
    >
      {children}
    </Row>
  );
}

export function Avatar({ src, login, size, th }: { src: string | null; login: string; size: number; th: CardTheme }) {
  const ring = { border: `5px solid ${th.ring}`, boxShadow: `0 6px 18px ${th.shadow}` };
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
        background: th.panel,
        color: th.muted,
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
export function Pill({ children, th }: { children: string; th: CardTheme }) {
  return (
    <Row
      style={{
        padding: '5px 18px',
        borderRadius: 999,
        border: `2px solid ${th.seal}`,
        color: th.seal,
        fontSize: 22,
        fontWeight: 700,
      }}
    >
      {children}
    </Row>
  );
}

/** A small gray tag, e.g. today's role. */
export function Tag({ children, size = 22, th }: { children: string; size?: number; th: CardTheme }) {
  return (
    <Row style={{ padding: '4px 14px', borderRadius: 10, background: th.panel, color: th.ink, fontSize: size, fontWeight: 700 }}>
      {children}
    </Row>
  );
}

/** Avatar, display name and @login in a row (daily and yearly cards). */
export function PersonHeader({ avatar, name, login, right, th }: {
  avatar: string | null;
  name: string;
  login: string;
  right: ReactNode;
  th: CardTheme;
}) {
  return (
    <Row style={{ alignItems: 'center', gap: 20 }}>
      <Avatar src={avatar} login={login} size={76} th={th} />
      <Col style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.2 }}>{name}</Text>
        <Text style={{ fontSize: 22, color: th.muted }}>{`@${login}`}</Text>
      </Col>
      {right}
    </Row>
  );
}
