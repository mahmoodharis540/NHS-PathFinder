/** @type {import('next-intl').NextIntlConfig} */
module.exports = {
  locales: ["en", "es", "fr", "pl", "pa", "ur", "bn", "gu", "ar", "zh"], // supported languages
  defaultLocale: "en", // fallback if no locale is provided
  messagesDirectory: "messages", // folder where your translation JSON files live
};
