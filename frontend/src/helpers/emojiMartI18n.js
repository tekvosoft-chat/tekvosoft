import { i18n } from "../translate/i18n";

/**
 * Textos do seletor de emoji (emoji-mart) no idioma do sistema. Sem isso
 * ele aparecia em inglês ("Search", "Frequently Used").
 */
const PT = {
  search: "Pesquisar",
  clear: "Limpar",
  notfound: "Nenhum emoji encontrado",
  skintext: "Tom de pele",
  categories: {
    search: "Resultados",
    recent: "Mais usados",
    smileys: "Carinhas e pessoas",
    people: "Pessoas e corpo",
    nature: "Animais e natureza",
    foods: "Comidas e bebidas",
    activity: "Atividades",
    places: "Viagens e lugares",
    objects: "Objetos",
    symbols: "Símbolos",
    flags: "Bandeiras",
    custom: "Personalizados"
  },
  categorieslabel: "Categorias de emoji",
  skintones: {
    1: "Padrão",
    2: "Claro",
    3: "Médio-claro",
    4: "Médio",
    5: "Médio-escuro",
    6: "Escuro"
  }
};

const ES = {
  search: "Buscar",
  clear: "Borrar",
  notfound: "No se encontraron emojis",
  skintext: "Tono de piel",
  categories: {
    search: "Resultados",
    recent: "Más usados",
    smileys: "Caras y personas",
    people: "Personas y cuerpo",
    nature: "Animales y naturaleza",
    foods: "Comida y bebida",
    activity: "Actividades",
    places: "Viajes y lugares",
    objects: "Objetos",
    symbols: "Símbolos",
    flags: "Banderas",
    custom: "Personalizados"
  },
  categorieslabel: "Categorías de emoji",
  skintones: {
    1: "Predeterminado",
    2: "Claro",
    3: "Medio claro",
    4: "Medio",
    5: "Medio oscuro",
    6: "Oscuro"
  }
};

export const emojiMartI18n = () => {
  const lang = String(i18n.language || "").toLowerCase();
  if (lang.startsWith("pt")) return PT;
  if (lang.startsWith("es")) return ES;
  return undefined;
};
