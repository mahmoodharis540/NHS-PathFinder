/** @type {import('next-intl').NextIntlConfig} */
module.exports = {
  locales: ["en", "es","pl","fr"], // supported languages got rid of , "fr", "pl", "pa", "ur", "bn", "gu", "ar", "zh"
  defaultLocale: "en", // fallback if no locale is provided
  messagesDirectory: "messages", // folder where your translation JSON files live
};
