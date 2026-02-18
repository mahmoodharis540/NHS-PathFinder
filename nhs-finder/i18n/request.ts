import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

const locales = ["en", "es", "fr", "pl"] as const;
type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  const headersList = await headers();
  const locale = (headersList.get("x-locale") ?? "en") as Locale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).defaut,
  };
});