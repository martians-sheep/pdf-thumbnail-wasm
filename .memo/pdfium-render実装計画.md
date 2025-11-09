# pdfium-render 実装計画

## 📋 概要

pdfium-render を使用して実際の PDF レンダリング機能を実装する計画書

**作成日**: 2025-11-09
**対象バージョン**: v0.2.0
**推定作業時間**: 3-4時間

---

## 🎯 実装目標

### 主要目標
1. ✅ pdfium-render 0.8 を統合
2. ✅ 実際の PDF ページレンダリングを実装
3. ✅ プレースホルダー実装を置き換え
4. ✅ WASM環境で動作確認

### 技術的目標
- Pdfium を使った高品質レンダリング
- メモリ効率的な実装
- エラーハンドリングの充実
- WASM 環境での安定動作

---

## 📚 pdfium-render について

### 基本情報
- **バージョン**: 0.8.36
- **ライセンス**: MIT OR Apache-2.0
- **WASM対応**: ✅ 完全対応
- **GitHub**: https://github.com/ajrcarey/pdfium-render

### 重要な特徴
1. **Chromium の Pdfium ベース** - 高品質・高速
2. **WASM 明示サポート** - ブラウザで動作実績あり
3. **高レベル API** - Rust らしい使いやすい API
4. **Runtime バインディング** - Pdfium バイナリを別途ロード

### 制約事項
⚠️ **Pdfium WASM バイナリが必要**
- サイズ: 約 10MB (非圧縮)
- Brotli 圧縮: 約 3.5MB
- 別途ダウンロード・配布が必要

---

## 🏗️ アーキテクチャ設計

### モジュール構成

```
src/
├── lib.rs              # メインエントリポイント (変更必要)
├── pdf_renderer.rs     # PDF レンダリングロジック (完全書き換え)
├── image_processor.rs  # 画像処理 (変更不要)
├── types.rs           # 型定義 (変更不要)
└── utils.rs           # ユーティリティ (変更不要)
```

### データフロー

```
JavaScript/TypeScript
    ↓ (PDF バイナリデータ)
PdfThumbnail::new(pdf_data)
    ↓
PdfRenderer::new(pdf_data)
    ↓ (Pdfium でパース)
Pdfium::load_pdf_from_byte_vec()
    ↓
PdfDocument (メモリ内)
    ↓
PdfRenderer::render_page(page, scale)
    ↓ (Pdfium でレンダリング)
PdfBitmap (BGRA 形式)
    ↓ (RGB 変換)
RawImage { width, height, data: Vec<u8> }
    ↓
image_processor::process_image()
    ↓ (リサイズ・エンコード)
Vec<u8> (JPEG/PNG/WebP)
    ↓
JavaScript (Uint8Array)
```

---

## 🔧 実装詳細

### Step 1: pdf_renderer.rs の完全書き換え

#### 1.1 必要な import

```rust
use crate::types::*;
use pdfium_render::prelude::*;
```

#### 1.2 構造体の再設計

```rust
/// PDFレンダラー - Pdfiumを使用
pub struct PdfRenderer {
    pdfium: Pdfium,
    document: PdfDocument<'static>,
}
```

**設計のポイント:**
- `pdfium: Pdfium` - Pdfium ライブラリのインスタンス
- `document: PdfDocument<'static>` - パース済み PDF ドキュメント
- ライフタイムは `'static` (WASM では問題ない)

#### 1.3 初期化メソッド

```rust
impl PdfRenderer {
    pub fn new(pdf_data: Vec<u8>) -> Result<Self, String> {
        // WASM環境でのPdfium初期化
        #[cfg(target_arch = "wasm32")]
        let pdfium = Pdfium::new(
            Pdfium::bind_to_library(Pdfium::pdfium_platform_library_name_at_path("./"))
                .or_else(|_| Pdfium::bind_to_library("pdfium"))
                .map_err(|e| format!("Failed to load Pdfium: {:?}", e))?
        );

        // ネイティブ環境でのPdfium初期化
        #[cfg(not(target_arch = "wasm32"))]
        let pdfium = Pdfium::new(
            Pdfium::bind_to_system_library()
                .map_err(|e| format!("Failed to load Pdfium: {:?}", e))?
        );

        // PDFドキュメントをロード
        let document = pdfium
            .load_pdf_from_byte_vec(pdf_data, None)
            .map_err(|e| format!("Failed to load PDF: {:?}", e))?;

        Ok(Self { pdfium, document })
    }
}
```

**重要な注意点:**
- WASM と ネイティブで初期化方法が異なる
- WASM: `bind_to_library("pdfium")` - 別途ロードされた Pdfium WASM を参照
- ネイティブ: `bind_to_system_library()` - システムの Pdfium ライブラリを使用
- エラーは全て `String` に変換して返す

#### 1.4 ページ数取得

```rust
pub fn get_page_count(&self) -> Result<u32, String> {
    Ok(self.document.pages().len() as u32)
}
```

**シンプル:** `PdfDocument::pages().len()` で取得可能

#### 1.5 ページ情報取得

```rust
pub fn get_page_info(&self, page: u32) -> Result<PageInfo, String> {
    // ページインデックス (0-based)
    let page_index = PdfPageIndex::new(page.saturating_sub(1));

    // ページ取得
    let pdf_page = self.document
        .pages()
        .get(page_index)
        .map_err(|e| format!("Failed to get page {}: {:?}", page, e))?;

    // サイズと回転を取得
    let size = pdf_page.page_size();
    let rotation = pdf_page.rotation();

    Ok(PageInfo {
        page,
        width: size.width.value,
        height: size.height.value,
        rotation: rotation.as_degrees() as i32,
    })
}
```

**ポイント:**
- `page` は 1-based (JavaScript側)、Pdfium は 0-based
- `saturating_sub(1)` で安全に変換
- `PdfPoints` → `f32` への変換

#### 1.6 ページレンダリング (最重要)

```rust
pub fn render_page(&self, page: u32, scale: f32) -> Result<RawImage, String> {
    let page_index = PdfPageIndex::new(page.saturating_sub(1));

    let pdf_page = self.document
        .pages()
        .get(page_index)
        .map_err(|e| format!("Failed to get page {}: {:?}", page, e))?;

    // レンダリング設定
    let page_size = pdf_page.page_size();
    let render_width = (page_size.width.value * scale) as u32;
    let render_height = (page_size.height.value * scale) as u32;

    let render_config = PdfRenderConfig::new()
        .set_target_width(render_width)
        .set_maximum_height(render_height)
        .rotate_if_landscape(PdfBitmapRotation::None, false);

    // ビットマップにレンダリング
    let bitmap = pdf_page
        .render_with_config(&render_config)
        .map_err(|e| format!("Failed to render page: {:?}", e))?;

    // サイズ取得
    let width = bitmap.width() as u32;
    let height = bitmap.height() as u32;

    // BGRA → RGB 変換
    let bgra_data = bitmap.as_bytes();
    let mut rgb_data = Vec::with_capacity((width * height * 3) as usize);

    for chunk in bgra_data.chunks(4) {
        if chunk.len() >= 4 {
            // BGRA → RGB
            rgb_data.push(chunk[2]); // R
            rgb_data.push(chunk[1]); // G
            rgb_data.push(chunk[0]); // B
            // chunk[3] はアルファチャンネル (無視)
        }
    }

    Ok(RawImage {
        width,
        height,
        data: rgb_data,
    })
}
```

**重要なポイント:**

1. **レンダリング設定**
   - `set_target_width()` - 目標幅
   - `set_maximum_height()` - 最大高さ
   - `rotate_if_landscape()` - 自動回転 (今回は無効)

2. **色空間変換**
   - Pdfium は **BGRA** 形式で返す
   - image-rs は **RGB** 形式を期待
   - 手動で変換が必要

3. **メモリ効率**
   - `Vec::with_capacity()` で事前確保
   - アロケーション回数を最小化

#### 1.7 RawImage 構造体

```rust
/// 生の画像データ（RGB形式）
pub struct RawImage {
    pub width: u32,
    pub height: u32,
    pub data: Vec<u8>, // RGB形式（ピクセルあたり3バイト）
}
```

**既存の image_processor.rs と互換性あり**

---

### Step 2: lib.rs の更新

#### 2.1 import の追加

```rust
use pdf_renderer::PdfRenderer;
```

#### 2.2 構造体の変更

```rust
#[wasm_bindgen]
pub struct PdfThumbnail {
    renderer: PdfRenderer,  // pdf_data の代わりに PdfRenderer を保持
}
```

**変更理由:**
- PDF データの保持は不要 (PdfRenderer が管理)
- page_count も PdfRenderer から取得可能

#### 2.3 コンストラクタの更新

```rust
#[wasm_bindgen(constructor)]
pub fn new(pdf_data: &[u8]) -> Result<PdfThumbnail, JsValue> {
    utils::log(&format!("Creating PdfThumbnail with {} bytes", pdf_data.len()));

    let renderer = PdfRenderer::new(pdf_data.to_vec())
        .map_err(|e| JsValue::from_str(&format!("Failed to create renderer: {}", e)))?;

    Ok(PdfThumbnail { renderer })
}
```

#### 2.4 メソッドの更新

```rust
#[wasm_bindgen(js_name = getPageCount)]
pub fn get_page_count(&self) -> u32 {
    self.renderer.get_page_count().unwrap_or(0)
}

#[wasm_bindgen(js_name = getPageInfo)]
pub fn get_page_info(&self, page: u32) -> Result<JsValue, JsValue> {
    let info = self.renderer.get_page_info(page)
        .map_err(|e| JsValue::from_str(&e))?;

    serde_wasm_bindgen::to_value(&info)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

#[wasm_bindgen(js_name = generateThumbnail)]
pub async fn generate_thumbnail(&self, options: JsValue) -> Result<Vec<u8>, JsValue> {
    let opts: ThumbnailOptions = serde_wasm_bindgen::from_value(options)
        .map_err(|e| JsValue::from_str(&format!("Invalid options: {}", e)))?;

    utils::log(&format!(
        "Generating thumbnail for page {} with width {}",
        opts.page, opts.width
    ));

    // ページをレンダリング
    let raw_image = self.renderer.render_page(opts.page, opts.scale)
        .map_err(|e| JsValue::from_str(&format!("Rendering error: {}", e)))?;

    // 画像を処理してエンコード
    image_processor::process_image(raw_image, &opts)
        .map_err(|e| JsValue::from_str(&format!("Image processing error: {}", e)))
}
```

**変更点:**
- プレースホルダーコードを削除
- `renderer.render_page()` を呼び出し
- `image_processor::process_image()` でエンコード

---

### Step 3: Pdfium WASM バイナリの準備

#### 3.1 推奨ダウンロード元

```bash
# Option 1: paulocoutinhox/pdfium-lib (推奨)
# https://github.com/paulocoutinhox/pdfium-lib/releases

# 最新の WASM ビルドをダウンロード
mkdir -p wasm-assets
cd wasm-assets

# 例: Chromium 6666 ベース
curl -L https://github.com/paulocoutinhox/pdfium-lib/releases/download/chromium%2F6666/pdfium-wasm.tgz -o pdfium-wasm.tgz

# 展開
tar -xzf pdfium-wasm.tgz
```

**重要:** growable heap 対応版を選ぶこと

#### 3.2 ファイル配置

```
pdf-thumbnail-wasm/
├── wasm-assets/
│   └── pdfium.wasm      # Pdfium WASM バイナリ
├── pkg/                 # wasm-pack 出力先
│   ├── pdf_thumbnail_wasm.js
│   ├── pdf_thumbnail_wasm_bg.wasm
│   └── pdfium.wasm      # ← ここにコピー
└── examples/
    └── public/
        └── pdfium.wasm  # ← ここにもコピー
```

#### 3.3 ビルドスクリプト

```bash
#!/bin/bash
# scripts/build-with-pdfium.sh

set -e

echo "🔨 Building pdf-thumbnail-wasm with Pdfium..."

# 1. WASM ビルド
wasm-pack build --target web --out-dir pkg --release

# 2. Pdfium WASM をコピー
if [ -f wasm-assets/pdfium.wasm ]; then
    echo "📦 Copying Pdfium WASM..."
    cp wasm-assets/pdfium.wasm pkg/
    cp wasm-assets/pdfium.wasm examples/public/
else
    echo "⚠️  Warning: pdfium.wasm not found in wasm-assets/"
    echo "   Download from: https://github.com/paulocoutinhox/pdfium-lib/releases"
fi

echo "✅ Build complete!"
```

---

## 🧪 テスト計画

### 単体テスト

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_raw_image_structure() {
        let img = RawImage {
            width: 100,
            height: 100,
            data: vec![0u8; 100 * 100 * 3],
        };

        assert_eq!(img.width, 100);
        assert_eq!(img.height, 100);
        assert_eq!(img.data.len(), 30000); // 100*100*3
    }
}
```

**注:** Pdfium が必要なテストは統合テストへ

### 統合テスト

```rust
// tests/integration_test.rs
#[cfg(test)]
mod tests {
    use pdf_thumbnail_wasm::*;
    use std::fs;

    #[test]
    #[ignore] // CI では無効化
    fn test_real_pdf_rendering() {
        let pdf_data = fs::read("tests/fixtures/sample.pdf")
            .expect("Test PDF not found");

        let thumbnail = PdfThumbnail::new(&pdf_data)
            .expect("Failed to create thumbnail");

        assert!(thumbnail.get_page_count() > 0);
    }
}
```

### ブラウザテスト

1. **http://localhost:5173/** にアクセス
2. PDF ファイルを選択
3. サムネイル生成ボタンをクリック
4. コンソールログを確認:
   ```
   ✅ WASM module initialized with Pdfium
   Creating PdfThumbnail with XXX bytes
   Generating thumbnail for page 1 with width 400
   ✅ Page 1 generated in XX.XXms
   ```
5. 画像が表示されることを確認（白枠ではなく実際のPDF内容）

---

## ⚠️ 既知の問題と対策

### 問題 1: Pdfium WASM ロードエラー

**症状:**
```
Failed to load Pdfium: ...
```

**原因:**
- pdfium.wasm が見つからない
- CORS エラー

**対策:**
1. pdfium.wasm が正しいパスにあるか確認
2. 開発サーバーの CORS ヘッダー確認
3. ブラウザの開発者ツールでネットワークタブを確認

### 問題 2: メモリ不足エラー

**症状:**
```
RuntimeError: memory access out of bounds
```

**原因:**
- WASM のメモリが不足
- 大きな PDF や高解像度レンダリング

**対策:**
1. `scale` パラメータを下げる (2.0 → 1.0)
2. growable heap 対応の Pdfium を使用
3. ページを分割して処理

### 問題 3: 色がおかしい

**症状:**
- 青と赤が入れ替わっている

**原因:**
- BGRA → RGB 変換のミス

**対策:**
```rust
// 正しい順序:
rgb_data.push(chunk[2]); // R (BGRAの3番目)
rgb_data.push(chunk[1]); // G (BGRAの2番目)
rgb_data.push(chunk[0]); // B (BGRAの1番目)
```

---

## 📊 期待される結果

### パフォーマンス

| 指標 | 目標値 | 測定方法 |
|------|--------|---------|
| 1ページレンダリング | < 100ms | `console.log` タイムスタンプ |
| メモリ使用量 | < 100MB | ブラウザ開発者ツール |
| WASM サイズ | < 500KB | `pkg/*.wasm` のサイズ |
| Pdfium サイズ | ~10MB (3.5MB 圧縮) | `pdfium.wasm` のサイズ |

### 品質

- ✅ 実際の PDF コンテンツが表示される
- ✅ 日本語フォントが正しく表示される
- ✅ 画像・グラフィックスが正確
- ✅ ページ回転が考慮される

---

## 🚀 リリースまでのステップ

### Phase 1: 基本実装 (今回)
- [x] pdfium-render 依存関係追加
- [ ] pdf_renderer.rs 実装
- [ ] lib.rs 更新
- [ ] ローカルで動作確認

### Phase 2: 最適化 (次回)
- [ ] エラーハンドリング改善
- [ ] メモリ管理最適化
- [ ] キャッシュ機構追加

### Phase 3: ドキュメント (次回)
- [ ] API ドキュメント更新
- [ ] README 更新
- [ ] 使用例追加

---

## 📝 参考資料

### 公式ドキュメント
- [pdfium-render docs.rs](https://docs.rs/pdfium-render/)
- [pdfium-render GitHub](https://github.com/ajrcarey/pdfium-render)
- [Pdfium 公式](https://pdfium.googlesource.com/pdfium/)

### サンプルコード
- [WASM Example](https://github.com/ajrcarey/pdfium-render/tree/master/examples)
- [Browser Integration](https://github.com/ajrcarey/pdfium-render/blob/master/examples/browser.rs)

### トラブルシューティング
- [Issues](https://github.com/ajrcarey/pdfium-render/issues)
- [Discussions](https://github.com/ajrcarey/pdfium-render/discussions)

---

## ✅ チェックリスト

実装前に確認:
- [ ] Rust 1.91.0 以上がインストール済み
- [ ] wasm-pack がインストール済み
- [ ] pdfium.wasm をダウンロード済み

実装中に確認:
- [ ] pdf_renderer.rs がコンパイルエラーなし
- [ ] lib.rs がコンパイルエラーなし
- [ ] cargo check が成功
- [ ] cargo test が成功（統合テストは除く）

動作確認:
- [ ] wasm-pack build が成功
- [ ] 開発サーバーが起動
- [ ] ブラウザで PDF が選択できる
- [ ] サムネイル生成が成功
- [ ] 実際の PDF 内容が表示される

---

**最終更新**: 2025-11-09
**ステータス**: 🟡 実装準備完了 → 実装開始
