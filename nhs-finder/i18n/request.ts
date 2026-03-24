import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

const locales = [
  "en",
  "ar-EG",
  "apc",
  "ary",
  "ar-AE",
  "acm",
  "sk",
  "ti",
  "ckb",
  "ur",
  "fa",
  "ro",
  "pl",
  "so",
  "syl",
  "tr",
  "vi",
  "sq",
  "am",
  "fr",
  "pa-Arab-PK",
  "yue",
  "kmr",
  "om",
] as const;

type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  const headersList = await headers();
  const requested = headersList.get("x-locale");

  const locale: Locale = locales.includes(requested as Locale)
    ? (requested as Locale)
    : "en";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});