import { CompatNotFoundView } from '@/components/CompatProblem';
import { LOCALES } from '@/i18n/config';
import { createT } from '@/i18n/messages';
import type { NotFoundMessages } from '@/components/NotFoundView';

export default function CompatNotFound() {
  const messages: Record<string, NotFoundMessages> = {};
  for (const { code } of LOCALES) {
    const t = createT(code);
    messages[code] = {
      notFound: t('ui.error.notFound'),
      blocked: t('ui.error.blocked'),
      invalidLogin: t('ui.error.invalidLogin'),
      home: t('ui.nav.home'),
      disclaimer: t('ui.disclaimer'),
    };
  }
  return <CompatNotFoundView messages={messages} />;
}
