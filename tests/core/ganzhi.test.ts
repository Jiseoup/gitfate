import { expect, test } from 'vitest';
import {
  BRANCHES,
  BRANCH_MOD,
  STEMS,
  TEN_GOD_BASE,
  branchElement,
  branchRelation,
  branchZodiac,
  controls,
  generates,
  parsePillar,
  stemElement,
  stemIsYang,
  tenGod,
} from '@/core/ganzhi';
import { ELEMENTS } from '@/core/types';

test('element cycle', () => {
  expect(generates('wood', 'fire')).toBe(true);
  expect(generates('water', 'wood')).toBe(true);
  expect(controls('metal', 'wood')).toBe(true);
  expect(controls('wood', 'earth')).toBe(true);
});

test('element cycle is complete and exclusive', () => {
  expect(ELEMENTS).toEqual(['wood', 'fire', 'earth', 'metal', 'water']);
  for (const a of ELEMENTS) {
    expect(ELEMENTS.filter((b) => generates(a, b))).toHaveLength(1);
    expect(ELEMENTS.filter((b) => controls(a, b))).toHaveLength(1);
    expect(generates(a, a)).toBe(false);
    expect(controls(a, a)).toBe(false);
  }
});

test('stem and branch tables', () => {
  expect(STEMS.join('')).toBe('甲乙丙丁戊己庚辛壬癸');
  expect(BRANCHES.join('')).toBe('子丑寅卯辰巳午未申酉戌亥');
  expect(STEMS.filter(stemIsYang).join('')).toBe('甲丙戊庚壬');
  expect(STEMS.map(stemElement)).toEqual([
    'wood', 'wood', 'fire', 'fire', 'earth', 'earth', 'metal', 'metal', 'water', 'water',
  ]);
  expect(BRANCHES.map(branchElement)).toEqual([
    'water', 'earth', 'wood', 'wood', 'earth', 'fire', 'fire', 'earth', 'metal', 'metal', 'earth', 'water',
  ]);
});

test('tenGod from day master', () => {
  expect(tenGod('辛', '癸')).toBe('shishen'); // 금생수, 같은 음
  expect(tenGod('辛', '壬')).toBe('shangguan'); // 금생수, 음양 다름
  expect(tenGod('辛', '辛')).toBe('bijian');
  expect(tenGod('辛', '庚')).toBe('jiecai');
  expect(tenGod('辛', '乙')).toBe('piancai'); // 금극목, 같은 음
  expect(tenGod('辛', '甲')).toBe('zhengcai');
  expect(tenGod('辛', '丁')).toBe('qisha'); // 화극금, 같은 음
  expect(tenGod('辛', '丙')).toBe('zhengguan');
  expect(tenGod('辛', '己')).toBe('pianyin'); // 토생금, 같은 음
  expect(tenGod('辛', '戊')).toBe('zhengyin');
});

test('tenGod covers all ten gods exactly once per day master', () => {
  for (const day of STEMS) {
    expect(new Set(STEMS.map((s) => tenGod(day, s))).size).toBe(10);
  }
});

test('branch relations with priority liuhe > sanhe > chong > xing', () => {
  expect(branchRelation('子', '丑')).toBe('liuhe');
  expect(branchRelation('申', '辰')).toBe('sanhe');
  expect(branchRelation('子', '午')).toBe('chong');
  expect(branchRelation('寅', '申')).toBe('chong'); // 형이기도 하지만 충 우선
  expect(branchRelation('巳', '申')).toBe('liuhe'); // 형이기도 하지만 합 우선
  expect(branchRelation('子', '卯')).toBe('xing');
  expect(branchRelation('午', '午')).toBe('xing');
  expect(branchRelation('子', '子')).toBe('none');
  expect(branchRelation('丑', '子')).toBe(branchRelation('子', '丑'));
});

test('branch relations are symmetric', () => {
  for (const a of BRANCHES) {
    for (const b of BRANCHES) {
      expect(branchRelation(a, b)).toBe(branchRelation(b, a));
    }
  }
});

test('zodiac and parse', () => {
  expect(branchZodiac('寅')).toBe('tiger');
  expect(branchZodiac('子')).toBe('rat');
  expect(branchZodiac('亥')).toBe('pig');
  expect(parsePillar('壬寅')).toEqual({ stem: '壬', branch: '寅' });
});

test('parsePillar rejects invalid input', () => {
  for (const bad of ['', '壬', '壬寅子', '寅壬', '壬壬', 'ab', '壬 ', ' 壬寅']) {
    expect(() => parsePillar(bad)).toThrow();
  }
});

test('score tables', () => {
  expect(TEN_GOD_BASE).toEqual({
    shishen: 75,
    zhengyin: 72,
    zhengcai: 70,
    zhengguan: 68,
    piancai: 65,
    bijian: 60,
    pianyin: 58,
    shangguan: 55,
    jiecai: 50,
    qisha: 48,
  });
  expect(BRANCH_MOD).toEqual({ liuhe: 10, sanhe: 6, chong: -12, xing: -6, none: 0 });
});
