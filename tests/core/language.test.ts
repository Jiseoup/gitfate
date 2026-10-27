import { expect, test } from 'vitest';
import { computeChart } from '@/core/chart';
import { colorToElement, diagnoseLanguages, languageElement, languageProfile } from '@/core/language';

test.each([
  ['Rust', '#dea584', 'fire'],
  ['C++', '#f34b7d', 'fire'],
  ['Swift', '#F05138', 'fire'],
  ['Ruby', '#701516', 'fire'],
  ['JavaScript', '#f1e05a', 'earth'],
  ['Java', '#b07219', 'earth'],
  ['SQL', '#e38c00', 'earth'],
  ['Shell', '#89e051', 'wood'],
  ['C#', '#178600', 'wood'],
  ['C', '#555555', 'metal'],
  ['Kotlin', '#A97BFF', 'metal'],
  ['Elixir', '#6e4a7e', 'metal'],
  ['TypeScript', '#3178c6', 'water'],
  ['Python', '#3572A5', 'water'],
  ['Go', '#00ADD8', 'water'],
  ['Lua', '#000080', 'water'],
])('%s color maps to element', (name, color, el) => expect(languageElement(name, color)).toBe(el));

test('colorToElement accepts 3-digit hex in any case and throws on garbage', () => {
  expect(colorToElement('#F00')).toBe('fire');
  expect(colorToElement('#00ADD8')).toBe(colorToElement('#00add8'));
  expect(() => colorToElement('nope')).toThrow();
});

test('unparseable color falls back to the hash like a null color', () => {
  expect(languageElement('Brainfuck', 'nope')).toBe(languageElement('Brainfuck', null));
});

test('null color falls back to a stable hash; overrides win', () => {
  expect(languageElement('Brainfuck', null)).toBe(languageElement('Brainfuck', null));
  expect(languageElement('Go', '#00ADD8', { Go: 'metal' })).toBe('metal');
});

test('profile excludes markup and sums duplicates', () => {
  const prof = languageProfile([
    { name: 'TypeScript', color: '#3178c6', bytes: 600 },
    { name: 'CSS', color: '#663399', bytes: 900 },
    { name: 'Rust', color: '#dea584', bytes: 200 },
    { name: 'TypeScript', color: '#3178c6', bytes: 200 },
  ]);
  expect(prof.total).toBe(1000);
  expect(prof.topLanguages.map((l) => l.name)).toEqual(['TypeScript', 'Rust']);
  expect(prof.shares.water).toBeCloseTo(0.8);
});

test('diagnosis', () => {
  const chart = computeChart(new Date('2022-04-28T04:46:16Z'), { kind: 'iana', name: 'Asia/Seoul' }); // weakest: fire
  expect(diagnoseLanguages(chart, languageProfile([]))).toEqual({
    diagnosis: 'noData',
    targetElement: 'fire',
    luckyLanguage: 'Rust',
  });
  expect(
    diagnoseLanguages(chart, languageProfile([{ name: 'TypeScript', color: '#3178c6', bytes: 1 }])).diagnosis,
  ).toBe('alsoMissing');
  const comp = diagnoseLanguages(
    chart,
    languageProfile([
      { name: 'Swift', color: '#F05138', bytes: 30 },
      { name: 'Go', color: '#00ADD8', bytes: 70 },
    ]),
  );
  expect(comp).toEqual({ diagnosis: 'compensating', targetElement: 'fire', luckyLanguage: 'Swift' });
});
