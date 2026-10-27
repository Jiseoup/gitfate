import { expect, test } from 'vitest';
import { fullYears } from '@/components/format';

test('GitHub age counts whole years, turning over on the signup anniversary', () => {
  expect(fullYears('2015-03-04', '2026-03-03')).toBe(10);
  expect(fullYears('2015-03-04', '2026-03-04')).toBe(11);
  expect(fullYears('2015-03-04', '2026-10-27')).toBe(11);
  expect(fullYears('2026-10-27', '2026-10-27')).toBe(0);
  // A Feb 29 signup ages on Mar 1 in common years.
  expect(fullYears('2016-02-29', '2027-02-28')).toBe(10);
  expect(fullYears('2016-02-29', '2027-03-01')).toBe(11);
});
