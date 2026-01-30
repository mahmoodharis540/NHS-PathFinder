import { NextIntlClientProvider } from "next-intl";
import React from "react";

interface Props {
  children: React.ReactNode;
  params: { locale?: string };
}

export default async function LocaleLayout({ children, params }: Props) {
  // Unwrap locale
  const locale = params.locale || "en";

  // Load messages dynamically
  let messages;
  try {
    messages = await import(`../../messages/${locale}.json`).then((m) => m.default);
  } catch (e) {
    console.warn(`No messages found for locale "${locale}", falling back to English.`);
    messages = await import(`../../messages/en.json`).then((m) => m.default);
  }

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
