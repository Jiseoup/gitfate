import { LOCALES } from '@/i18n/config';
import { createT } from '@/i18n/messages';
import { NotFoundView, type NotFoundMessages } from '@/components/NotFoundView';

// not-found files receive no props, so the client view reads the locale and login from the URL.
export default function LocaleNotFound() {
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
  return <NotFoundView messages={messages} />;
}
