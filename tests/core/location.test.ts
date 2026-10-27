import { getCountry } from 'countries-and-timezones';
import { expect, test } from 'vitest';
import aliases from '../../data/country-aliases.json';
import cities from '../../data/cities.json';
import { isValidIana } from '@/core/time';
import { countryOptions, locationToIana } from '@/core/location';

test.each([
  ['Republic of Korea', 'Asia/Seoul'],
  ['Seoul, Korea', 'Asia/Seoul'],
  ['Berlin, Germany', 'Europe/Berlin'],
  ['San Francisco, CA', 'America/Los_Angeles'],
  ['Japan', 'Asia/Tokyo'],
  ['  대한민국 ', 'Asia/Seoul'],
  ['China', 'Asia/Shanghai'],
  ['constructor', null],
  ['__proto__', null],
  ['Seoul, toString', 'Asia/Seoul'],
  ['Germany', 'Europe/Berlin'],
  ['USA', null],
  ['Australia', null],
  ['Earth', null],
  ['', null],
  [null, null],
])('%s → %s', (loc, iana) => expect(locationToIana(loc as string | null)).toBe(iana));

test('countryOptions lists every country sorted by name', () => {
  const options = countryOptions();
  expect(options.length).toBeGreaterThan(200);
  const names = options.map((o) => o.name);
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
  expect(options.find((o) => o.code === 'KR')).toEqual({ code: 'KR', name: 'South Korea', timezones: ['Asia/Seoul'] });
});

test('data files are consistent', () => {
  for (const [city, iana] of Object.entries(cities)) {
    expect(isValidIana(iana), `${city} -> ${iana}`).toBe(true);
  }
  for (const [alias, code] of Object.entries(aliases)) {
    expect(getCountry(code), `${alias} -> ${code}`).toBeTruthy();
  }
});
