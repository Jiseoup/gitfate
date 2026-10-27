export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export const ELEMENTS: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];

export type Stem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';

export type Branch =
  | '子'
  | '丑'
  | '寅'
  | '卯'
  | '辰'
  | '巳'
  | '午'
  | '未'
  | '申'
  | '酉'
  | '戌'
  | '亥';

export type TenGod =
  | 'bijian'
  | 'jiecai'
  | 'shishen'
  | 'shangguan'
  | 'piancai'
  | 'zhengcai'
  | 'qisha'
  | 'zhengguan'
  | 'pianyin'
  | 'zhengyin';

export type BranchRelation = 'liuhe' | 'sanhe' | 'chong' | 'xing' | 'none';

export type Zodiac =
  | 'rat'
  | 'ox'
  | 'tiger'
  | 'rabbit'
  | 'dragon'
  | 'snake'
  | 'horse'
  | 'goat'
  | 'monkey'
  | 'rooster'
  | 'dog'
  | 'pig';

export interface Pillar {
  stem: Stem;
  branch: Branch;
}
