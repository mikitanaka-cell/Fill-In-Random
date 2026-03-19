import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import fs from "fs"; // require("fs") をこちらにまとめました
import router from "./routes";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// 【どんな場所でも見つけられるようにする設定】
const possiblePaths = [
  path.join(process.cwd(), "artifacts/quiz-app/dist/public"),
  path.join(process.cwd(), "public"),
  path.join(__dirname, "../../quiz-app/dist/public"),
  path.join(__dirname, "public")
];

possiblePaths.forEach(staticPath => {
  app.use(express.static(staticPath));
});

// Express 5 用の書き方 "(.*)" に変更しました
app.get("(.*)", (req, res) => {
  // /api で始まるリクエストは何もしない（次に回す）
  if (req.path.startsWith('/api')) return;

  for (const staticPath of possiblePaths) {
    const indexPath = path.join(staticPath, "index.html");
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  res.status(404).send("画面パーツ（index.html）が見つかりません。");
});

export default app;import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import router from "./routes";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// 【重要】__dirname を使わずに、process.cwd() を使ってパスを計算します
const root = process.cwd();
const possiblePaths = [
  path.join(root, "public"),
  path.join(root, "artifacts/quiz-app/dist/public"),
  path.join(root, "artifacts/api-server/src/public"),
  path.join(root, "artifacts/api-server/public")
];

// 存在するフォルダから静的ファイルを表示できるように設定
possiblePaths.forEach(staticPath => {
  if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));
  }
});

// Express 5 用のワイルドカード指定 "(.*)"
app.get("(.*)", (req, res, next) => {
  // APIへのリクエストはここでは処理しない
  if (req.path.startsWith('/api')) {
    return next();
  }

  // index.html を探して返す
  for (const staticPath of possiblePaths) {
    const indexPath = path.join(staticPath, "index.html");
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  
  // どこにもなければ 404
  res.status(404).send("画面パーツ（index.html）が見つかりません。");
});

export default app;
