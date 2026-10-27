import { expect, test } from 'vitest';
import { ImageResponse } from 'next/og';
import { renderToStaticMarkup } from 'react-dom/server';
import { STEMS } from '@/core/ganzhi';
import { ELEMENTS } from '@/core/types';
import { ELEMENT_ICONS, ElementIcon } from '@/icons/elements';
import type { Icon } from '@/icons/frame';
import { SIGN_ICONS, SignIcon } from '@/icons/signs';

const ALL: [string, Icon][] = [
  ...STEMS.map((s) => [`sign ${s}`, SIGN_ICONS[s]] as [string, Icon]),
  ...ELEMENTS.map((e) => [`element ${e}`, ELEMENT_ICONS[e]] as [string, Icon]),
];

test('there is one icon per stem and per element, all different drawings', () => {
  expect(Object.keys(SIGN_ICONS)).toHaveLength(10);
  expect(Object.keys(ELEMENT_ICONS)).toHaveLength(5);
  const drawings = ALL.map(([, I]) => renderToStaticMarkup(I({})));
  expect(new Set(drawings).size).toBe(drawings.length);
});

for (const [name, I] of ALL) {
  test(`${name}: an <svg> of the requested size and color, Satori-safe markup only`, () => {
    for (const size of [20, 96]) {
      const html = renderToStaticMarkup(I({ size, color: '#123456' }));
      expect(html.startsWith('<svg')).toBe(true);
      expect(html).toContain(`width="${size}"`);
      expect(html).toContain(`height="${size}"`);
      expect(html).toContain('viewBox="0 0 24 24"');
      expect(html).toContain('#123456');
      expect(html).not.toMatch(/class=|<use|<text|<filter|<mask|<linearGradient|<image|style=/);
    }
    // Without a color the icon follows the surrounding text color.
    expect(renderToStaticMarkup(I({}))).toContain('currentColor');
  });
}

test('SignIcon and ElementIcon pick the icon by stem and element', () => {
  expect(renderToStaticMarkup(<SignIcon stem="辛" size={32} />)).toBe(renderToStaticMarkup(SIGN_ICONS['辛']({ size: 32 })));
  expect(renderToStaticMarkup(<ElementIcon element="water" size={32} />)).toBe(
    renderToStaticMarkup(ELEMENT_ICONS.water({ size: 32 })),
  );
});

test('every icon renders through real Satori (next/og) at small and large sizes', async () => {
  const element = (
    <div style={{ display: 'flex', flexWrap: 'wrap', width: 1200, height: 260, background: '#ffffff' }}>
      {ALL.map(([name, I]) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <I size={96} color="#16a34a" />
          <I size={20} color="#0f172a" />
        </div>
      ))}
    </div>
  );
  const res = new ImageResponse(element, { width: 1200, height: 260 });
  const bytes = new Uint8Array(await res.arrayBuffer());
  expect([...bytes.slice(1, 4)]).toEqual([0x50, 0x4e, 0x47]);
}, 30000);
