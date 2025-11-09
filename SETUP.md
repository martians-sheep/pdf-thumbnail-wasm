# 開発環境セットアップガイド

このガイドでは、pdf-thumbnail-wasmの開発環境をセットアップする方法を説明します。

## 前提条件

### 必須ツール

1. **Rust** (1.70以上)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup target add wasm32-unknown-unknown
   ```

2. **wasm-pack**
   ```bash
   curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
   ```

3. **Node.js** (16.0.0以上)
   - [nodejs.org](https://nodejs.org/)からダウンロード
   - または[nvm](https://github.com/nvm-sh/nvm)を使用:
     ```bash
     nvm install 18
     nvm use 18
     ```

4. **pnpm** (推奨) または npm
   ```bash
   npm install -g pnpm
   ```

### オプションツール

- **VS Code** と推奨拡張機能（`.vscode/extensions.json`を参照）
- **Rust Analyzer** - IDE サポート用
- **cargo-watch** - 自動リビルド用:
  ```bash
  cargo install cargo-watch
  ```

## 初期セットアップ

1. **リポジトリをクローン**
   ```bash
   git clone https://github.com/martians-sheep/pdf-thumbnail-wasm.git
   cd pdf-thumbnail-wasm
   ```

2. **Node.js依存関係のインストール**
   ```bash
   pnpm install
   ```

3. **WASMモジュールのビルド**
   ```bash
   # すべてのターゲット向けにビルド
   pnpm run build:all

   # または特定のターゲット向けにビルド
   pnpm run build:wasm      # Web向け
   pnpm run build:node      # Node.js向け
   pnpm run build:bundler   # Bundler向け
   ```

4. **セットアップの確認**
   ```bash
   # テストを実行
   pnpm test

   # Rustテストを実行
   cargo test

   # フォーマットをチェック
   cargo fmt -- --check

   # clippyを実行
   cargo clippy -- -D warnings
   ```

## 開発ワークフロー

### サンプルアプリケーションの実行

1. **サンプルPDFを追加** - `public/`ディレクトリに配置:
   ```bash
   cp /path/to/your/sample.pdf public/sample.pdf
   ```

2. **開発サーバーを起動**:
   ```bash
   pnpm run example
   ```

3. **ブラウザを開く** - http://localhost:5173

### コードの変更

1. **Rustコードの編集** - `src/`内のファイルを編集:
   ```bash
   # 変更時に自動リビルド
   cargo watch -x 'build --target wasm32-unknown-unknown'
   ```

2. **WASMを再ビルド**:
   ```bash
   pnpm run build:wasm
   ```

3. **ブラウザをリロード** - 変更を確認

### テスト

```bash
# すべてのテストを実行
pnpm test

# Rustテストのみ実行
cargo test

# Rustテストを出力付きで実行
cargo test -- --nocapture

# 特定のテストを実行
cargo test test_name

# JSテストをウォッチモードで実行
pnpm run test:watch

# UIモードでテストを実行
pnpm run test:ui

# ブラウザでWASMテストを実行
pnpm run test:wasm
```

### ベンチマーク

```bash
# Rustベンチマークを実行
cargo bench

# 特定のベンチマークを実行
cargo bench bench_name
```

### リントとフォーマット

```bash
# Rustコードをフォーマット
cargo fmt

# フォーマットをチェック
cargo fmt -- --check

# clippyを実行
cargo clippy

# 警告をエラーとしてclippyを実行
cargo clippy -- -D warnings
```

## プロジェクト構造

```
pdf-thumbnail-wasm/
├── .github/              # GitHub Actionsワークフロー
├── .vscode/              # VS Code設定
├── benches/              # Rustベンチマーク
├── examples/             # デモアプリケーション
│   ├── index.html       # エントリHTML
│   ├── App.tsx          # Reactデモアプリ
│   └── style.css        # スタイル
├── js/                   # TypeScriptラッパー
│   ├── index.ts         # メインエクスポート
│   ├── types.d.ts       # 型定義
│   ├── browser.ts       # ブラウザユーティリティ
│   └── node.ts          # Node.jsユーティリティ
├── public/               # 公開アセット
├── src/                  # Rustソースコード
│   ├── lib.rs           # メインエントリポイント
│   ├── pdf_renderer.rs  # PDFレンダリング
│   ├── image_processor.rs # 画像処理
│   ├── types.rs         # 型定義
│   └── utils.rs         # ユーティリティ
├── tests/                # テストファイル
├── pkg/                  # WASMビルド出力（Web）
├── pkg-node/            # WASMビルド出力（Node.js）
├── pkg-bundler/         # WASMビルド出力（Bundler）
├── Cargo.toml           # Rust設定
├── package.json         # Node.js設定
├── tsconfig.json        # TypeScript設定
├── vite.config.ts       # Vite設定
└── vitest.config.ts     # Vitest設定
```

## ビルド出力

`pnpm run build:all`を実行すると、以下が生成されます:

- **pkg/** - Webターゲット（ESモジュール）
- **pkg-node/** - Node.jsターゲット（CommonJS）
- **pkg-bundler/** - Bundlerターゲット（webpack、rollup等用）

各ディレクトリには以下が含まれます:
- `*.wasm` - WebAssemblyバイナリ
- `*.js` - JavaScriptバインディング
- `*.d.ts` - TypeScript型定義
- `package.json` - パッケージメタデータ

## よくある問題

### WASMビルドが失敗する

**問題**: `wasm-pack build`がコンパイルエラーで失敗する

**解決策**:
```bash
# ビルドキャッシュをクリーン
cargo clean

# Rustを更新
rustup update

# 再ビルド
pnpm run build:wasm
```

### モジュールが見つからないエラー

**問題**: サンプル実行時にインポートエラーが発生する

**解決策**:
```bash
# WASMがビルドされていることを確認
pnpm run build:wasm

# Viteキャッシュをクリア
rm -rf node_modules/.vite

# 開発サーバーを再起動
pnpm run example
```

### テストが失敗する

**問題**: 変更後にテストが失敗する

**解決策**:
```bash
# WASMを再ビルド
pnpm run build:all

# テストを実行
pnpm test
```

## 次のステップ

- [CONTRIBUTING.md](CONTRIBUTING.md)でコントリビューションガイドラインを確認
- [README.md](README.md)でAPIドキュメントを確認
- [examples/](examples/)ディレクトリで使用例を確認
- [GitHub Discussions](https://github.com/martians-sheep/pdf-thumbnail-wasm/discussions)でディスカッションに参加

## ヘルプ

- **Issues**: [GitHub Issues](https://github.com/martians-sheep/pdf-thumbnail-wasm/issues)
- **Discussions**: [GitHub Discussions](https://github.com/martians-sheep/pdf-thumbnail-wasm/discussions)
- **ドキュメント**: [README.md](README.md)
