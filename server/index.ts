import { app } from "./app";

const port = 3001;

app.listen(port, () => {
  console.log(`Мок-сервер: http://localhost:${port}`);
});
