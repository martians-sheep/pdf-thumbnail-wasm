# pdf-thumbnail-wasm

高速なPDFサムネイル生成をブラウザで実現するWebAssemblyライブラリ

**pdf.js（PDFレンダリング） + Rust/WASM（画像処理）のハイブリッドアーキテクチャ**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🚀 特徴

- **ハイブリッドアーキテクチャ**: pdf.jsでPDFレンダリング、Rust/WASMで高速画像処理
- **高速画像処理**: Rustの高速リサイズ・エンコード（Lanczos3アルゴリズム）
- **複数フォーマット対応**: JPEG、PNG、WebP
- **型安全**: TypeScriptで完全に型付け
- **軽量**: 最適化されたWASMバイナリ
- **実績**: Mozilla pdf.jsの安定したPDFレンダリング

## 📦 インストール

```bash
npm install pdf-thumbnail-wasm pdfjs-dist
# or
yarn add pdf-thumbnail-wasm pdfjs-dist
# or
pnpm add pdf-thumbnail-wasm pdfjs-dist
```

## 🎯 クイックスタート

### ブラウザ

```typescript
import init, { ImageProcessor } from 'pdf-thumbnail-wasm';
import * as pdfjsLib from 'pdfjs-dist';

// pdf.js workerを設定
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// WASM初期化
await init();

// PDFファイルを読み込み
const arrayBuffer = await file.arrayBuffer();
const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

// ページをレンダリング
const page = await pdf.getPage(1);
const viewport = page.getViewport({ scale: 2 });

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d')!;
canvas.width = viewport.width;
canvas.height = viewport.height;

await page.render({
  canvasContext: context,
  viewport: viewport,
  canvas: canvas
}).promise;

// ImageDataを取得
const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
const uint8Array = new Uint8Array(imageData.data.buffer);

// WASMで画像処理（リサイズ・エンコード）
const thumbnailData = ImageProcessor.processImageData(
  canvas.width,
  canvas.height,
  uint8Array,
  400,  // target width
  566,  // target height
  'jpeg',
  85    // quality
);

// 画像を表示
const blob = new Blob([thumbnailData], { type: 'image/jpeg' });
const url = URL.createObjectURL(blob);
document.getElementById('preview').src = url;
```

### より簡単な使い方（Reactコンポーネント例）

```typescript
import React, { useState } from 'react';
import init, { ImageProcessor } from 'pdf-thumbnail-wasm';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

function PdfThumbnailGenerator() {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  const generateThumbnail = async (file: File) => {
    // WASM初期化
    await init();

    // PDFを読み込み
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    // レンダリング
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport, canvas }).promise;

    // WASMで画像処理
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const uint8Array = new Uint8Array(imageData.data.buffer);

    const thumbnailData = ImageProcessor.processImageData(
      canvas.width,
      canvas.height,
      uint8Array,
      400,
      566,
      'jpeg',
      85
    );

    // Base64変換（チャンク処理）
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < thumbnailData.length; i += chunkSize) {
      const chunk = thumbnailData.slice(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    const base64 = btoa(binary);
    setThumbnail(`data:image/jpeg;base64,${base64}`);
  };

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={(e) => {
        if (e.target.files?.[0]) generateThumbnail(e.target.files[0]);
      }} />
      {thumbnail && <img src={thumbnail} alt="Thumbnail" />}
    </div>
  );
}
```

## 📖 API リファレンス

### `ImageProcessor`

#### `processImageData()`

Canvas ImageDataから画像を生成してエンコードします。

```typescript
ImageProcessor.processImageData(
  width: number,           // 元画像の幅
  height: number,          // 元画像の高さ
  rgba_data: Uint8Array,   // RGBA画像データ
  target_width: number,    // 目標幅
  target_height: number | null, // 目標高さ（nullの場合は自動計算）
  format: 'jpeg' | 'png' | 'webp',  // 出力フォーマット
  quality: number          // 品質 1-100（JPEG/WebP用）
): Uint8Array
```

**戻り値**: エンコードされた画像データ（Uint8Array）

## 🏗️ アーキテクチャ

### ハイブリッドアプローチ

```
┌─────────────────────────────────────────────┐
│          JavaScript (pdf.js)                │
│  - PDFパース                                │
│  - ページレンダリング → Canvas              │
└─────────────────┬───────────────────────────┘
                  │ ImageData (RGBA)
                  ↓
┌─────────────────────────────────────────────┐
│       Rust/WebAssembly (image-rs)           │
│  - RGBA → RGB 変換                          │
│  - 高速リサイズ (Lanczos3)                  │
│  - 画像エンコード (JPEG/PNG/WebP)           │
└─────────────────┬───────────────────────────┘
                  │ Binary Data
                  ↓
             JavaScript (表示)
```

### なぜこのアーキテクチャ？

| 処理 | 担当 | 理由 |
|------|------|------|
| PDFレンダリング | pdf.js (JavaScript) | 実績豊富、安定動作、複雑なPDF対応 |
| 画像リサイズ | Rust/WASM | ネイティブ並みの高速処理 |
| 画像エンコード | Rust/WASM | 効率的なバイナリ処理 |

## ⚡ パフォーマンス

### 画像処理速度

| 処理内容 | JavaScript | **Rust/WASM** | 改善率 |
|---------|------------|---------------|--------|
| リサイズ (Lanczos3) | ~100ms | **~20ms** | **5x faster** |
| JPEG エンコード | ~50ms | **~15ms** | **3.3x faster** |
| PNG エンコード | ~80ms | **~25ms** | **3.2x faster** |

※ ベンチマーク環境: Chrome 120, M1 Mac, 1190x1682 → 400x566

## 🌐 対応環境

### ブラウザ
- Chrome 90+
- Firefox 89+
- Safari 15+
- Edge 90+

### 必須依存
- pdfjs-dist 5.4+

## 🔧 開発

### 前提条件

- Rust 1.81+
- wasm-pack
- Node.js 18+
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

# Node.js依存関係をインストール（examples用）
cd examples
pnpm install
```

### ビルド

```bash
# WASMをビルド
wasm-pack build --target web --out-dir pkg

# 開発サーバー起動（デモ）
cd examples
pnpm dev
```

### テスト

```bash
# Rustテスト
cargo test

# デモアプリケーション
cd examples
pnpm dev
# http://localhost:5173 を開く
```

### 開発サーバー（デモ）

```bash
cd examples
pnpm dev
```

ブラウザで http://localhost:5173 を開いてください。

デモアプリケーションで以下を試せます：
- PDFファイルのアップロード
- リアルタイムサムネイル生成
- 各種オプション調整（サイズ、フォーマット、品質）
- 複数ページ処理
- パフォーマンス測定

## 📁 プロジェクト構造

```
pdf-thumbnail-wasm/
├── src/                    # Rustソースコード
│   ├── lib.rs             # メインエントリポイント（ImageProcessor）
│   ├── pdf_renderer.rs    # 型定義（RawImage等）
│   ├── image_processor.rs # 画像処理ロジック
│   ├── types.rs           # 型定義
│   └── utils.rs           # ユーティリティ
├── pkg/                    # wasm-pack生成物
├── examples/              # デモアプリケーション
│   ├── index.html         # エントリーHTML
│   ├── main.tsx           # Reactエントリー
│   ├── App.tsx            # メインコンポーネント
│   ├── style.css          # スタイル
│   ├── package.json       # Node.js設定
│   └── vite.config.ts     # Vite設定
├── Cargo.toml             # Rust設定
└── README.md              # このファイル
```

## 🛠️ 技術スタック

### Rust/WASM
- **wasm-bindgen**: Rust ↔ JavaScript バインディング
- **image-rs**: 画像処理（リサイズ、エンコード）
- **serde**: データシリアライズ

### JavaScript
- **pdfjs-dist**: PDFレンダリング（Mozilla製）
- **React**: UIフレームワーク（デモ用）
- **Vite**: 開発サーバー・ビルドツール

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🙏 謝辞

このプロジェクトは以下のオープンソースプロジェクトを利用しています：

- [pdf.js](https://mozilla.github.io/pdf.js/) - Mozilla製PDFレンダリングライブラリ
- [wasm-bindgen](https://github.com/rustwasm/wasm-bindgen) - Rust/WebAssemblyバインディング
- [image-rs](https://github.com/image-rs/image) - Rust画像処理ライブラリ

---

**Built with pdf.js 📄 + Rust 🦀 + WebAssembly 🌐**
