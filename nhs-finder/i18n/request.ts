import { getRequestConfig } from "next-intl/server";

const locales = ["en", "es", "fr", "pl"] as const;
type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  const locale: Locale = "en"; // default for now

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});