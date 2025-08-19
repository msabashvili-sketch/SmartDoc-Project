import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ka from "./locales/ka/translation.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ka: {
        translation: ka,
      },
    },
    lng: "ka", // default language is Georgian
    fallbackLng: "ka",
    interpolation: {
      escapeValue: false, // React already protects from XSS
    },
  });

export default i18n;
