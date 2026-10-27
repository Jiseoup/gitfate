import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CountryPicker } from '@/components/CountryPicker';
import { pickerCountries } from '@/reading/countries';

afterEach(cleanup);

const countries = pickerCountries('ko');

function renderPicker() {
  const onSelect = vi.fn();
  render(<CountryPicker countries={countries} label="출생 국가 변경" cityLabel="도시" onSelect={onSelect} />);
  return onSelect;
}

test('single-timezone country selects its zone immediately', () => {
  const onSelect = renderPicker();
  const country = screen.getByLabelText('출생 국가 변경') as HTMLSelectElement;
  expect(screen.getByRole('option', { name: '대한민국' })).toBeTruthy();
  fireEvent.change(country, { target: { value: 'KR' } });
  expect(onSelect).toHaveBeenCalledWith('Asia/Seoul');
  expect(screen.queryByLabelText('도시')).toBeNull();
});

test('countries whose zones share one offset count as single-timezone', () => {
  const onSelect = renderPicker();
  fireEvent.change(screen.getByLabelText('출생 국가 변경'), { target: { value: 'DE' } });
  expect(onSelect).toHaveBeenCalledWith('Europe/Berlin');
});

test('multi-timezone country asks for a city first', () => {
  const onSelect = renderPicker();
  fireEvent.change(screen.getByLabelText('출생 국가 변경'), { target: { value: 'US' } });
  expect(onSelect).not.toHaveBeenCalled();
  const city = screen.getByLabelText('도시') as HTMLSelectElement;
  expect([...city.options].some((o) => o.value === 'America/Chicago')).toBe(true);
  fireEvent.change(city, { target: { value: 'America/Chicago' } });
  expect(onSelect).toHaveBeenCalledWith('America/Chicago');
});
