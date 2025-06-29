// 必要なパッケージを読み込みます
const express = require('express');             // Webサーバー機能
const line = require('@line/bot-sdk');          // LINEのBot SDK
require('dotenv').config();                     // .envの読み込み

// .envファイルからLINEの設定を読み込みます
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN, // LINEのアクセストークン
  channelSecret: process.env.CHANNEL_SECRET             // LINEのシークレット
};

// expressアプリを作成
const app = express();

// LINEのWebhook処理のためのミドルウェアを設定
app.post('/webhook', line.middleware(config), (req, res) => {
  // LINEから送られてきたイベントを1件ずつ処理
  Promise
    .all(req.body.events.map(handleEvent))  // 複数イベントでも全部処理
    .then((result) => res.json(result))     // 処理が終わったらLINEに返事
    .catch((err) => {
      console.error('エラーが発生しました:', err); // エラーはログに出すだけ
      res.status(500).end();               // 止まらずに500で返す
    });
});

// ユーザーからのメッセージを処理する関数
function handleEvent(event) {
  // メッセージイベントだけを処理（スタンプとかは無視）
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);  // 無視して何もしない
  }

  // ユーザーの名前（表示名）を取得する
  const userId = event.source.userId;

  return client.getProfile(userId)
    .then((profile) => {
      const userName = profile.displayName;

      // 「○○さん、こんにちは！」というメッセージを作る
      const replyMessage = {
        type: 'text',
        text: `${userName}さん、こんにちは！`
      };

      // ユーザーに返事する
      return client.replyMessage(event.replyToken, replyMessage);
    })
    .catch((err) => {
      console.error('プロフィール取得失敗:', err);
    });
}

// LINE用のクライアントを作成（返信などに使う）
const client = new line.Client(config);

// サーバーを起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LINE Botサーバーを起動しました → http://localhost:${PORT}`);
});
