import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import moment from "moment";
import "moment/locale/pt-br";
import "moment/locale/pt";
import "moment/locale/es";
import "moment/locale/fr";
import "moment/locale/de";
import "moment/locale/it";
import "moment/locale/id";

import { messages } from "./languages";

// datas relativas ("em 3 dias", "há 2 horas") no idioma do sistema: sem os
// arquivos de idioma o moment ficava sempre em inglês
const MOMENT_LOCALES = {
  pt: "pt-br",
  pt_PT: "pt",
  es: "es",
  fr: "fr",
  de: "de",
  it: "it",
  id: "id",
  en: "en"
};
const syncMoment = lng => {
  const key = String(lng || "").replace("-", "_");
  moment.locale(MOMENT_LOCALES[key] || MOMENT_LOCALES[key.slice(0, 2)] || "en");
};
i18n.on("languageChanged", syncMoment);

i18n.use(LanguageDetector).init({
  debug: false,
  detection: {
    order: ["localStorage", "navigator"],
    lookupLocalStorage: "language",
    caches: ["localStorage"]
  },
  defaultNS: ["translations"],
  fallbackLng: "en",
  // o React já escapa o texto na tela; escapar aqui trocava "/" por "&#x2F;"
  // nas datas e nomes colocados dentro das frases
  interpolation: { escapeValue: false },
  ns: ["translations"],
  resources: messages
});

syncMoment(i18n.language);

export { i18n, syncMoment as syncMomentLocale };
