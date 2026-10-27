import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DailyCard, hourRange } from '@/components/DailyCard';
import { pillarName } from '@/components/sign-text';
import { branchZodiac } from '@/core/ganzhi';
import { createT } from '@/i18n/messages';
import { okReading } from '../fixtures/user-reading';

afterEach(cleanup);

const { daily } = okReading({ withActivity: true });

function renderDaily(locale: string) {
  return render(
    <DailyCard daily={daily} t={createT(locale, daily.variantSeed)} locale={locale} name="Ji Seoup" firstCommit={false} />,
  );
}

test("today's role is the tag; the traditional ten-god name is only its tooltip", () => {
  const { container } = renderDaily('en');
  const en = createT('en');
  const role = screen.getByText(en(`terms.tenGod.${daily.tenGod}`));
  expect(role.getAttribute('title')).toBe(en(`terms.tenGodSaju.${daily.tenGod}`));
  expect(container.textContent).toContain(`Today's role${en(`terms.tenGod.${daily.tenGod}`)}`);
  expect(container.textContent).not.toContain(en(`terms.tenGodSaju.${daily.tenGod}`));
});

test("today's pillar is a color-and-animal chip and the almanac shows translations only", () => {
  const { container } = renderDaily('ko');
  const ko = createT('ko');
  const chip = screen.getByText(pillarName(ko, daily.dayPillar));
  expect(chip.getAttribute('title')).toBe(`${ko(`terms.stem.${daily.dayPillar.stem}`)} · ${ko(`terms.branch.${daily.dayPillar.branch}`)}`);
  expect(screen.getByRole('heading', { name: '고대 달력 가라사대' })).toBeTruthy();
  const text = container.textContent ?? '';
  expect(text).toContain('하면 좋은 일');
  expect(text).toContain('피할 일');
  expect(text).toContain(ko(`yiji.${daily.yi[0]}`));
  expect(text).toContain(`오늘의 역할${ko(`terms.tenGod.${daily.tenGod}`)}`);
  const animal = ko(`terms.animal.${branchZodiac(daily.lucky.hourBranch)}`);
  expect(text).toContain(`${hourRange(daily.lucky.hourBranch)} · ${animal} 시`);
  expect(text).not.toMatch(/\p{Script=Han}/u);
});
