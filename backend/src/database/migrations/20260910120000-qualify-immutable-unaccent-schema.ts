import { QueryInterface } from "sequelize";

/**
 * Qualifica o schema na chamada a unaccent() dentro de immutable_unaccent().
 *
 * O pg_dump restaura com search_path vazio. Como o corpo da função chamava
 * unaccent() sem qualificar, a recriação do índice
 * tags_name_unaccent_lower_index falhava durante a restauração de um backup —
 * o banco voltava sem esse índice, sem nenhum aviso.
 *
 * O comportamento da função é idêntico; muda só a resolução do nome.
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
      RETURNS text AS $$
      SELECT public.unaccent($1);
      $$ LANGUAGE sql IMMUTABLE;
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
      RETURNS text AS $$
      SELECT unaccent($1);
      $$ LANGUAGE sql IMMUTABLE;
    `);
  }
};
