import { countryOptions } from '@/core/location';
import { isValidIana, tzOffsetMinutes } from '@/core/time';

export interface CountryChoice {
  code: string;
  /** Country name in the page locale. */
  name: string;
  /** One entry when the whole country shares one UTC offset; otherwise one per city. */
  zones: { iana: string; city: string }[];
}

const REFERENCES = [new Date('2026-01-15T00:00:00Z'), new Date('2026-07-15T00:00:00Z')];

function offsetsKey(iana: string): string {
  return REFERENCES.map((at) => tzOffsetMinutes({ kind: 'iana', name: iana }, at)).join(',');
}

function cityOf(iana: string): string {
  return iana.slice(iana.lastIndexOf('/') + 1).replace(/_/g, ' ');
}

function displayNames(locale: string): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames([locale, 'en'], { type: 'region' });
  } catch {
    return null;
  }
}

const byLocale = new Map<string, CountryChoice[]>();

/** Country list for the birth-country picker, names localized and sorted for `locale`. Static, so memoized. */
export function pickerCountries(locale: string): CountryChoice[] {
  let list = byLocale.get(locale);
  if (!list) {
    list = buildCountries(locale);
    byLocale.set(locale, list);
  }
  return list;
}

function buildCountries(locale: string): CountryChoice[] {
  const names = displayNames(locale);
  const out: CountryChoice[] = [];
  for (const c of countryOptions()) {
    const zones = c.timezones.filter(isValidIana);
    if (zones.length === 0) continue;
    const first = offsetsKey(zones[0]);
    // Same rule as location lookup: one shared offset counts as a single timezone.
    const single = zones.every((z) => offsetsKey(z) === first);
    out.push({
      code: c.code,
      name: names?.of(c.code) ?? c.name,
      zones: (single ? zones.slice(0, 1) : zones)
        .map((iana) => ({ iana, city: cityOf(iana) }))
        .sort((a, b) => a.city.localeCompare(b.city, 'en')),
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, locale));
}
