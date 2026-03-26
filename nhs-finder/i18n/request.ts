import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const locales = [
  "en",
  "ar-EG",
  "ar-LB",
  "ar-MA",
  "ar-AE",
  "ar-IQ",
  "sk",
  "ti",
  "ckb",
  "ur",
  "fa",
  "ro",
  "pl",
  "so",
  "bn",
  "tr",
  "vi",
  "sq",
  "am",
  "fr",
  "pa-Arab-PK",
  "yue",
  "kmr",
  "om",
  "es",
  "ku-Arab-IQ"
] as const;

type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const requested = cookieStore.get("NEXT_LOCALE")?.value;

  const locale: Locale = locales.includes(requested as Locale)
    ? (requested as Locale)
    : "en";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});