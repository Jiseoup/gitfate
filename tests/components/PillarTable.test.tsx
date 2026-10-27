import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ElementBars } from '@/components/ElementBars';
import { PillarTable } from '@/components/PillarTable';
import { createT } from '@/i18n/messages';
import { okReading } from '../fixtures/user-reading';

afterEach(cleanup);

const { chart } = okReading({ withActivity: false });

test('each pillar shows its Sign icon and name, with its color-and-animal name (en)', () => {
  const { container } = render(<PillarTable chart={chart} t={createT('en')} />);
  const text = container.textContent ?? '';
  // Fixture pillars, hour → year: 辛未 · 己卯 · 戊寅 · 乙未
  for (const [name, pillar] of [
    ['The Jewel', 'White Goat'],
    ['The Garden', 'Yellow Rabbit'],
    ['The Mountain', 'Yellow Tiger'],
    ['The Vine', 'Green Goat'],
  ]) {
    expect(text).toContain(`${name}${pillar}`);
  }
  expect(container.querySelectorAll('svg')).toHaveLength(4);
  // The saju term rides along only as hover text.
  expect(screen.getByRole('img', { name: 'The Garden · Yin Earth' }).getAttribute('title')).toBe('The Garden · Yin Earth');
  expect(screen.getByText('Yellow Rabbit').getAttribute('title')).toBe('Yin Earth · Rabbit');
  expect(text).not.toContain('Yin Earth');
  expect(text).not.toMatch(/\p{Script=Han}/u);
});

test('Korean pillars use the Korean Sign names', () => {
  const { container } = render(<PillarTable chart={chart} t={createT('ko')} />);
  const text = container.textContent ?? '';
  for (const label of ['시 기둥', '일 기둥', '월 기둥', '연 기둥', '보석흰 양', '텃밭누런 토끼', '산누런 호랑이', '넝쿨푸른 양']) {
    expect(text).toContain(label);
  }
});

test('element bars carry an icon and the name, with no hanja', () => {
  const { container } = render(<ElementBars counts={chart.elementCounts} t={createT('en')} />);
  expect(container.querySelectorAll('svg')).toHaveLength(5);
  expect(container.textContent).toBe('Wood3Fire0Earth4Metal1Water0');
});
