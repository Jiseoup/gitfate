import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReadmeEmbed } from '@/components/ReadmeEmbed';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const labels = {
  card: 'Card',
  theme: 'Theme',
  types: { natal: 'Birth chart', daily: "Today's fortune", yearly: 'This year' },
  themes: { auto: 'Auto', light: 'Default', dark: 'Dark', 'github-light': 'GitHub light', 'github-dark': 'GitHub dark' },
  hint: 'Paste it into your README.',
  copy: 'Copy code',
  copied: 'Copied!',
  copyFailed: 'Could not copy.',
};

function setup() {
  return render(<ReadmeEmbed origin="https://gitfate.vercel.app" locale="en" login="Jiseoup" labels={labels} />);
}

test('starts on the birth chart with auto theme: <picture> code and a light/dark preview', () => {
  const { container } = setup();
  const code = container.querySelector('code')!.textContent!;
  expect(code).toContain('<picture>');
  expect(code).toContain('/api/card/natal/en/Jiseoup.png?theme=github-dark');
  expect(container.querySelector('source')!.getAttribute('srcset')).toBe('/api/card/natal/en/Jiseoup.png?theme=github-dark');
  expect(container.querySelector('img')!.getAttribute('src')).toBe('/api/card/natal/en/Jiseoup.png?theme=github-light');
});

test('choosing a card and a theme updates the preview and the Markdown', async () => {
  const user = userEvent.setup();
  const { container } = setup();
  await user.selectOptions(screen.getByLabelText('Card'), 'daily');
  await user.selectOptions(screen.getByLabelText('Theme'), 'dark');
  expect(container.querySelector('code')!.textContent).toBe(
    '[![gitfate](https://gitfate.vercel.app/api/card/daily/en/Jiseoup.png?theme=dark)](https://gitfate.vercel.app/en/Jiseoup)',
  );
  expect(container.querySelector('picture')).toBeNull();
  expect(container.querySelector('img')!.getAttribute('src')).toBe('/api/card/daily/en/Jiseoup.png?theme=dark');
});

test('copy writes the code to the clipboard and says so', async () => {
  const user = userEvent.setup();
  const writeText = vi.fn(async () => {});
  setup();
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  await user.click(screen.getByRole('button', { name: 'Copy code' }));
  expect(writeText).toHaveBeenCalledWith(expect.stringContaining('<picture>'));
  expect(await screen.findByText('Copied!')).toBeTruthy();
});
