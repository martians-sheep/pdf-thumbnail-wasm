# pdf-thumbnail-wasm

高速なPDFサムネイル生成をブラウザ・Node.js・Edge環境で実現するWebAssemblyライブラリ

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/pdf-thumbnail-wasm.svg)](https://www.npmjs.com/package/pdf-thumbnail-wasm)
[![Build Status](https://github.com/martians-sheep/pdf-thumbnail-wasm/workflows/CI/badge.svg)](https://github.com/martians-sheep/pdf-thumbnail-wasm/actions)

## 🚀 特徴

- **高速**: pdfjs-distと比較して3倍以上高速なレンダリング
- **軽量**: WASMバイナリサイズ < 1MB、メモリ使用量50%削減
- **クロスプラットフォーム**: ブラウザ・Node.js・Edge Runtime（Cloudflare Workers、Vercel Edge Functions）対応
- **型安全**: TypeScriptで完全に型付け
- **柔軟**: 複数フォーマット対応（JPEG、PNG、WebP）
- **効率的**: バッチ処理とストリーミング処理をサポート

## 📦 インストール

```bash
npm install pdf-thumbnail-wasm
# or
yarn add pdf-thumbnail-wasm
# or
pnpm add pdf-thumbnail-wasm
```

## 🎯 クイックスタート

### ブラウザ

```typescript
import init, { PdfThumbnail } from 'pdf-thumbnail-wasm';

// WASM初期化
await init();

// PDFファイルを読み込み
const response = await fetch('sample.pdf');
const arrayBuffer = await response.arrayBuffer();
const pdfData = new Uint8Array(arrayBuffer);

// サムネイル生成
const processor = new PdfThumbnail(pdfData);
const thumbnail = await processor.generateThumbnail({
  page: 1,
  width: 400,
  format: 'jpeg',
  quality: 85
});

// Blob URLを作成して表示
const blob = new Blob([thumbnail], { type: 'image/jpeg' });
const url = URL.createObjectURL(blob);
document.getElementById('preview').src = url;

// リソース解放
processor.dispose();
```

### Node.js

```typescript
import { PdfThumbnailNode } from 'pdf-thumbnail-wasm/node';
import { readFile, writeFile } from 'fs/promises';

// ファイルから直接読み込み
const processor = await PdfThumbnailNode.fromFile('input.pdf');

// サムネイル生成してファイルに保存
await processor.saveToFile('output.jpg', {
  page: 1,
  width: 800,
  format: 'jpeg',
  quality: 90
});

processor.dispose();
```

### バッチ処理

```typescript
// 複数ページの複数サイズを一括生成
const results = await processor.generateBatch({
  pages: [1, 2, 3],
  sizes: [
    { name: 'small', width: 200, height: 283 },
    { name: 'medium', width: 400, height: 566 },
    { name: 'large', width: 800, height: 1131 }
  ],
  format: 'webp',
  quality: 85,
  concurrency: 4
});

// Map<'page-size', Uint8Array>形式で取得
const smallPage1 = results.get('1-small');
const mediumPage2 = results.get('2-medium');
```

### ストリーミング処理

```typescript
// 大量のページを効率的に処理
for await (const result of processor.generateStream({
  pages: Array.from({ length: 100 }, (_, i) => i + 1),
  width: 400,
  format: 'jpeg'
})) {
  console.log(`Page ${result.page} generated`);
  // 個別に処理（保存、アップロード等）
  await saveToStorage(result.page, result.data);
}
```

## 📖 API リファレンス

### `PdfThumbnail`

#### Constructor

```typescript
new PdfThumbnail(pdfData: ArrayBuffer | Uint8Array)
```

#### Methods

##### `generateThumbnail(options?: ThumbnailOptions): Promise<Uint8Array>`

単一のサムネイルを生成します。

**Options:**
- `page?: number` - ページ番号（デフォルト: 1）
- `width?: number` - 幅（デフォルト: 400）
- `height?: number` - 高さ（デフォルト: auto）
- `format?: 'jpeg' | 'png' | 'webp'` - 出力フォーマット（デフォルト: 'jpeg'）
- `quality?: number` - 品質 1-100（デフォルト: 85、JPEG/WebP用）
- `scale?: number` - レンダリング倍率（デフォルト: 2）

##### `generateBatch(options?: BatchOptions): Promise<Map<string, Uint8Array>>`

複数のサムネイルを一括生成します。

**Options:** `ThumbnailOptions` に加えて:
- `pages?: number[]` - 複数ページ指定
- `sizes?: Array<{name: string, width: number, height: number}>` - 複数サイズ指定
- `concurrency?: number` - 並列処理数（デフォルト: 4）

##### `generateStream(options?: BatchOptions): AsyncGenerator<Result>`

ストリーミング形式でサムネイルを生成します。

**Yields:**
```typescript
{
  page: number;
  size: string;
  data: Uint8Array;
}
```

##### `getPageCount(): number`

PDFの総ページ数を取得します。

##### `getPageInfo(page: number): PageInfo`

特定ページの情報（サイズ、向き等）を取得します。

##### `dispose(): void`

リソースを解放します。使用後は必ず呼び出してください。

### `PdfThumbnailNode` (Node.js専用)

`PdfThumbnail` のすべてのメソッドに加えて:

##### `static fromFile(path: string): Promise<PdfThumbnailNode>`

ファイルパスから直接PDFを読み込みます。

##### `saveToFile(outputPath: string, options?: ThumbnailOptions): Promise<void>`

サムネイルを直接ファイルに保存します。

##### `saveToDirectory(outputDir: string, options?: BatchOptions): Promise<string[]>`

複数のサムネイルをディレクトリに保存します。保存されたファイルパスの配列を返します。

## ⚡ パフォーマンス

| 処理内容 | pdf-thumbnail-wasm | pdfjs-dist | 改善率 |
|---------|-------------------|------------|-------|
| 1ページレンダリング | ~50ms | ~150ms | **3x faster** |
| 画像リサイズ | ~20ms | ~50ms | **2.5x faster** |
| 初期化時間 | ~100ms | ~200ms | **2x faster** |
| メモリ使用量 | ~50MB | ~200MB | **75% less** |
| WASMサイズ | ~800KB | ~2.5MB | **68% smaller** |

※ ベンチマーク環境: Chrome 120, M1 Mac, 10ページのPDFドキュメント

## 🌐 対応環境

### ブラウザ
- Chrome 90+
- Firefox 89+
- Safari 15+
- Edge 90+

### Node.js
- Node.js 16.0.0+

### Edge Runtime
- Cloudflare Workers
- Vercel Edge Functions
- Deno 1.0+

## 🔧 開発

### 前提条件

- Rust 1.70+
- wasm-pack
- Node.js 16+
- pnpm（推奨）

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/martians-sheep/pdf-thumbnail-wasm.git
cd pdf-thumbnail-wasm

# Rust依存関係をインストール
cargo build

# wasm-packをインストール
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Node.js依存関係をインストール
pnpm install
```

### ビルド

```bash
# すべてのターゲット向けにビルド
pnpm run build:all

# 個別ターゲット
pnpm run build:wasm     # Web向け
pnpm run build:node     # Node.js向け
pnpm run build:bundler  # Bundler向け
```

### テスト

```bash
# すべてのテストを実行
pnpm test

# Rustテストのみ
cargo test

# JavaScriptテストのみ
pnpm run test:js

# ウォッチモード
pnpm run test:watch

# UI付きテスト
pnpm run test:ui
```

### ベンチマーク

```bash
# Rustベンチマーク
cargo bench

# JavaScriptベンチマーク
pnpm run bench
```

### 開発サーバー（デモ）

```bash
# デモサイトを起動
pnpm run example

# デモサイトをビルド
pnpm run example:build
```

ブラウザで http://localhost:5173 を開いてください。

## 📁 プロジェクト構造

```
pdf-thumbnail-wasm/
├── src/                    # Rustソースコード
│   ├── lib.rs             # メインエントリポイント
│   ├── pdf_renderer.rs    # PDFレンダリング
│   ├── image_processor.rs # 画像処理
│   ├── cache.rs           # キャッシュ機構
│   └── types.rs           # 型定義
├── js/                     # TypeScriptラッパー
│   ├── index.ts
│   ├── browser.ts
│   ├── node.ts
│   └── types.d.ts
├── pkg/                    # wasm-pack生成物（Web）
├── pkg-node/              # wasm-pack生成物（Node.js）
├── pkg-bundler/           # wasm-pack生成物（Bundler）
├── examples/              # デモアプリケーション
│   ├── index.html
│   ├── App.tsx
│   ├── style.css
│   └── sample.pdf
├── tests/                 # テスト
├── benches/               # ベンチマーク
├── Cargo.toml             # Rust設定
├── package.json           # Node.js設定
├── vite.config.ts         # Vite設定
└── vitest.config.ts       # Vitest設定
```


## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🙏 謝辞

このプロジェクトは以下のオープンソースプロジェクトを利用しています：

- [MuPDF](https://mupdf.com/) - 高速PDFレンダリングエンジン
- [wasm-bindgen](https://github.com/rustwasm/wasm-bindgen) - Rust/WebAssemblyバインディング
- [image-rs](https://github.com/image-rs/image) - Rust画像処理ライブラリ

---

**Built with Rust 🦀 + WebAssembly 🌐**
