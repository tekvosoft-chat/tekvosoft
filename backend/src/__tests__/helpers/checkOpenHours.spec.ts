import { checkOpenHours, hasOpenHours } from "../../helpers/checkOpenHours";

/**
 * A regra que importa aqui: fila sem expediente configurado atende sempre.
 * Já aconteceu de uma fila recém-criada responder "estamos fora do horário"
 * de madrugada para todo mundo, e é isso que estes testes seguram.
 */
describe("checkOpenHours", () => {
  const tz = "America/Sao_Paulo";

  it("atende quando não há horário definido", () => {
    expect(
      checkOpenHours({ weeklyRules: [], overrides: [], timezone: tz })
    ).toBe(true);
    expect(checkOpenHours({} as never)).toBe(true);
    expect(checkOpenHours(undefined as never)).toBe(true);
  });

  it("atende fora das exceções quando só há exceções", () => {
    expect(
      checkOpenHours({
        weeklyRules: [],
        overrides: [{ date: "1999-01-01", closed: true }],
        timezone: tz
      })
    ).toBe(true);
  });

  it("fecha no dia marcado como fechado", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(
      checkOpenHours({
        weeklyRules: [
          { days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], hours: [] }
        ],
        overrides: [{ date: today, closed: true }],
        timezone: tz
      })
    ).toBe(false);
  });

  it("respeita a faixa de horário do dia", () => {
    const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const weekday = days[new Date().getDay()];
    const aberto = checkOpenHours({
      weeklyRules: [{ days: [weekday], hours: [{ from: "00:00", to: "23:59" }] }],
      overrides: [],
      timezone: tz
    });
    const fechado = checkOpenHours({
      weeklyRules: [{ days: [weekday], hours: [] }],
      overrides: [],
      timezone: tz
    });
    expect(aberto).toBe(true);
    expect(fechado).toBe(false);
  });

  it("sabe dizer quando há expediente configurado", () => {
    expect(hasOpenHours({ weeklyRules: [], overrides: [], timezone: tz })).toBe(
      false
    );
    expect(
      hasOpenHours({
        weeklyRules: [{ days: ["mon"], hours: [{ from: "09:00", to: "18:00" }] }],
        overrides: [],
        timezone: tz
      })
    ).toBe(true);
  });
});
