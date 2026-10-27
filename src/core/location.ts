import { getAllCountries, getCountry } from 'countries-and-timezones';
import aliasData from '../../data/country-aliases.json';
import cityData from '../../data/cities.json';
import { tzOffsetMinutes } from './time';

// Maps (not plain objects) so inherited keys such as 'constructor' or '__proto__' never match.
const CITIES = new Map<string, string>(Object.entries(cityData));
const COUNTRY_ALIASES = new Map<string, string>(Object.entries(aliasData));

export interface CountryOption {
  code: string;
  name: string;
  timezones: string[];
}

function normalize(text: string): string {
  return text.normalize('NFC').trim().toLowerCase();
}

let countryNameIndex: Map<string, string> | null = null;

function countryCodeByName(name: string): string | undefined {
  if (!countryNameIndex) {
    countryNameIndex = new Map();
    for (const country of Object.values(getAllCountries())) {
      countryNameIndex.set(normalize(country.name), country.id);
    }
  }
  return countryNameIndex.get(name);
}

const WINTER_REFERENCE = new Date('2026-01-15T00:00:00Z');
const SUMMER_REFERENCE = new Date('2026-07-15T00:00:00Z');

/** A country counts as single-zone when all its zones share the same UTC offset in both winter and summer. */
function singleZoneOfCountry(code: string): string | null {
  const zones = getCountry(code)?.timezones ?? [];
  if (zones.length === 0) return null;
  const offsetsOf = (name: string) =>
    [WINTER_REFERENCE, SUMMER_REFERENCE].map((at) => tzOffsetMinutes({ kind: 'iana', name }, at)).join(',');
  const first = offsetsOf(zones[0]);
  return zones.every((z) => offsetsOf(z) === first) ? zones[0] : null;
}

function lookup(piece: string): string | null {
  if (!piece) return null;
  const city = CITIES.get(piece);
  if (city) return city;
  const code = COUNTRY_ALIASES.get(piece) ?? countryCodeByName(piece);
  return code ? singleZoneOfCountry(code) : null;
}

export function locationToIana(location: string | null): string | null {
  if (!location) return null;
  const whole = normalize(location);
  if (!whole) return null;
  const hit = lookup(whole);
  if (hit) return hit;
  for (const piece of whole.split(',')) {
    const found = lookup(piece.trim());
    if (found) return found;
  }
  return null;
}

export function countryOptions(): CountryOption[] {
  return Object.values(getAllCountries())
    .map((c) => ({ code: c.id, name: c.name, timezones: [...c.timezones] }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));
}
