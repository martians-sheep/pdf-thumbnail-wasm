# DevContainer 環境

このディレクトリには、pdf-thumbnail-wasmプロジェクトのDevContainer設定が含まれています。

## 概要

このDevContainerには以下が含まれています：

- **Rust** 1.75+ (wasm32-unknown-unknownターゲット付き)
- **wasm-pack** - WASMビルドツール
- **Node.js** 18.x
- **pnpm** - パッケージマネージャー
- **cargo-watch** - 自動リビルドツール
- **rustfmt & clippy** - コードフォーマットとリント

## 使い方

### VS Code で開く

1. このプロジェクトをVS Codeで開く
2. コマンドパレット（`Cmd/Ctrl + Shift + P`）を開く
3. "Dev Containers: Reopen in Container" を選択
4. コンテナのビルドと起動を待つ

### 初回セットアップ

コンテナが起動したら、自動的に `pnpm install` が実行されます。

### 開発コマンド

```bash
# WASMモジュールをビルド
pnpm run build:wasm

# すべてのターゲット向けにビルド
pnpm run build:all

# デモアプリを起動（ポート5173でアクセス可能）
pnpm run example

# Rustテストを実行
cargo test

# JavaScriptテストを実行
pnpm test

# コードをフォーマット
cargo fmt
```

### ポートフォワーディング

以下のポートが自動的にフォワードされます：

- **5173** - Vite開発サーバー（デモアプリ）

ブラウザで `http://localhost:5173` にアクセスしてデモアプリを確認できます。

## カスタマイズ

### 拡張機能の追加

`.devcontainer/devcontainer.json` の `extensions` セクションに追加してください。

### 追加パッケージのインストール

`Dockerfile` を編集して、必要なパッケージを追加してください。

## トラブルシューティング

### コンテナのリビルド

設定を変更した場合は、コンテナを再ビルドする必要があります：

1. コマンドパレットを開く
2. "Dev Containers: Rebuild Container" を選択

### キャッシュのクリア

ビルドキャッシュをクリアする場合：

```bash
# Cargoのキャッシュをクリア
cargo clean

# Node.jsのキャッシュをクリア
rm -rf node_modules
pnpm install
```

### パーミッションの問題

ファイルのパーミッションに問題がある場合：

```bash
# ワークスペース内のファイルの所有者を変更
sudo chown -R vscode:vscode /workspace
```

## パフォーマンス最適化

### ボリュームマウント

以下のボリュームが永続化されており、再ビルド時の時間を短縮します：

- **cargo-cache** - Cargoの依存関係キャッシュ
- **target-cache** - Rustのビルド出力キャッシュ

これらにより、コンテナを再起動してもビルド済みの成果物が保持されます。

## システム要件

- **Docker Desktop** または **Docker Engine** + **Docker Compose**
- **VS Code** + **Dev Containers 拡張機能**
- 最低 **8GB RAM** 推奨（Rustコンパイル用）
- 最低 **10GB** のディスク空き容量

## 参考リンク

- [VS Code Dev Containers ドキュメント](https://code.visualstudio.com/docs/devcontainers/containers)
- [Rust公式Dockerイメージ](https://hub.docker.com/_/rust)
- [wasm-pack ドキュメント](https://rustwasm.github.io/wasm-pack/)
