import express, { type Express } from "express";
import cors from "cors";
import path from "path"; // ← これを追加
import router from "./routes";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const staticPath = path.join(process.cwd(), "artifacts/quiz-app/dist/public");
app.use(express.static(staticPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

export default app;
