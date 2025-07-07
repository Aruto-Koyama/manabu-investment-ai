// 必要なパッケージを読み込みます
const express = require('express');             // Webサーバー機能
const line = require('@line/bot-sdk');          // LINEのBot SDK
require('dotenv').config();                     // .envの読み込み

// .envファイルからLINEの設定を読み込みます
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN, // 修正: LINE_CHANNEL_ACCESS_TOKEN
  channelSecret: process.env.LINE_CHANNEL_SECRET             // 修正: LINE_CHANNEL_SECRET
};

// デバッグ用ログ（一時的に追加）
console.log('=== 環境変数確認 ===');
console.log('LINE_CHANNEL_ACCESS_TOKEN exists:', !!process.env.LINE_CHANNEL_ACCESS_TOKEN);
console.log('LINE_CHANNEL_SECRET exists:', !!process.env.LINE_CHANNEL_SECRET);
console.log('ACCESS_TOKEN length:', process.env.LINE_CHANNEL_ACCESS_TOKEN?.length);
console.log('SECRET length:', process.env.LINE_CHANNEL_SECRET?.length);

// expressアプリを作成
const app = express();

// LINE用のクライアントを作成（返信などに使う）
const client = new line.Client(config);

// LINEのWebhook処理のためのミドルウェアを設定
app.post('/webhook', line.middleware(config), (req, res) => {
  console.log('=== Webhook受信 ===');
  
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

// サーバーを起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LINE Botサーバーを起動しました → http://localhost:${PORT}`);
  console.log(`プライマリURL https://manabu-investment-ai.onrender.comでご利用いただけます`);
});

// プロセス終了時のハンドリング
process.on('SIGINT', () => {
  console.log('サーバーを終了します');
  process.exit(0);
});
