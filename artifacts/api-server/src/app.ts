import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import router from "./routes";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// クイズ画面のパーツを探す場所（一番上の public フォルダ）
const publicPath = path.join(process.cwd(), "public");

if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// 最後に、API以外へのアクセスはすべてクイズ画面（index.html）を返す
// Express 5 でエラーにならない正規表現の書き方にしました
app.get(/^(?!\/api).+/, (req, res) => {
  const indexPath = path.join(publicPath, "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).send("画面パーツ（index.html）が見つかりません。");
});

export default app;
