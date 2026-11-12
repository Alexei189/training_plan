import { parseSmartAction, previewSmartAction } from "./parseSmartAction";

describe("parseSmartAction", () => {
  it("разбирает объект без ограды", () => {
    expect(
      parseSmartAction(
        '{"workoutName":"Лёгкий бег","plan":{"warmUp":"10 минут","main":""}}',
      ),
    ).toEqual({
      workoutName: "Лёгкий бег",
      plan: { warmUp: "10 минут", main: "" },
    });
  });

  it("снимает ограду json и обычную ограду", () => {
    expect(
      parseSmartAction(
        '```json\n{"workoutName":"Бег","plan":{"main":"ровно"}}\n```',
      ),
    ).toEqual({
      workoutName: "Бег",
      plan: { main: "ровно" },
    });
    expect(
      parseSmartAction('```\n{"workoutName":"Бег","plan":{}}\n```'),
    ).toEqual({
      workoutName: "Бег",
      plan: {},
    });
  });

  it("оставляет неизвестный строковый ключ и отбрасывает чужие поля", () => {
    expect(
      parseSmartAction(
        '{"workoutName":"Бег","plan":{"main":"ровно","extra":"чужой","workoutName":"внутри","athleteId":"ivanov","count":2}}',
      ),
    ).toEqual({
      workoutName: "Бег",
      plan: { main: "ровно", extra: "чужой" },
    });
  });

  it("не разбирает текст без объекта, названия или plan", () => {
    expect(parseSmartAction("не json")).toBeNull();
    expect(parseSmartAction('{"plan":{}}')).toBeNull();
    expect(parseSmartAction('{"workoutName":"Бег","plan":[]}')).toBeNull();
    expect(parseSmartAction('{"workoutName":"Бег"}')).toBeNull();
  });

  it("по кускам дописывает значение и не показывает оборванный escape", () => {
    expect(previewSmartAction('{"plan":{"main":"40')).toEqual({
      plan: { main: "40" },
    });
    expect(previewSmartAction('{"plan":{"main":"40 минут легко"')).toEqual({
      plan: { main: "40 минут легко" },
    });
    expect(previewSmartAction('{"workoutName":"Вос')).toEqual({
      workoutName: "Вос",
      plan: {},
    });
    expect(previewSmartAction('{"plan":{"extra":"скрыто","main":"40')).toEqual({
      plan: { main: "40" },
    });
    expect(previewSmartAction('{"plan":{"main":"10\\')).toEqual({
      plan: { main: "10" },
    });
    expect(previewSmartAction('{"plan":{"main":"10\\n')).toEqual({
      plan: { main: "10\n" },
    });
  });
});
