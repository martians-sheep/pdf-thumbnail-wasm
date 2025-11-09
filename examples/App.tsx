import React, { useState, useCallback, useEffect } from 'react';
import './style.css';
import init, { ImageProcessor } from '../pkg/pdf_thumbnail_wasm.js';
import * as pdfjsLib from 'pdfjs-dist';

// pdf.js の worker を設定（npmパッケージから直接読み込む）
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface ThumbnailResult {
  url: string;
  width: number;
  height: number;
  page: number;
  processingTime: number;
}

const App: React.FC = () => {
  const [isWasmReady, setIsWasmReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [thumbnails, setThumbnails] = useState<ThumbnailResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  // サムネイル生成オプション
  const [options, setOptions] = useState({
    page: 1,
    width: 400,
    height: 566,
    format: 'jpeg' as 'jpeg' | 'png' | 'webp',
    quality: 85,
    scale: 2,
    multiplePages: false,
    pageRange: '1-3'
  });

  // WASM初期化
  useEffect(() => {
    const initWasm = async () => {
      try {
        await init();
        setIsWasmReady(true);
        console.log('✅ WASM module initialized');
      } catch (err) {
        setError(`WASM初期化エラー: ${err}`);
        console.error('WASM initialization error:', err);
      }
    };
    initWasm();
  }, []);

  // ファイル選択ハンドラー
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
      setThumbnails([]);

      // PDFを読み込んでページ数を取得
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setPageCount(pdf.numPages);
        console.log(`📄 PDF loaded: ${pdf.numPages} pages`);
      } catch (err) {
        console.error('PDF loading error:', err);
        setError(`PDFの読み込みエラー: ${err}`);
      }
    } else {
      setError('PDFファイルを選択してください');
    }
  };

  // サムネイル生成処理（pdf.js + WASM実装）
  const generateThumbnail = useCallback(async () => {
    if (!selectedFile || !isWasmReady) return;

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const startTime = performance.now();

      console.log('📄 Processing PDF:', selectedFile.name);

      // PDFを読み込み
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      console.log(`📊 Page count: ${pdf.numPages}`);

      const results: ThumbnailResult[] = [];

      if (options.multiplePages) {
        const pages = parsePageRange(options.pageRange, pdf.numPages);

        for (let i = 0; i < pages.length; i++) {
          setProgress((i + 1) / pages.length * 100);

          const pageNum = pages[i];
          const pageStartTime = performance.now();

          // pdf.jsでページをレンダリング
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: options.scale });

          // Canvasにレンダリング
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

          // Uint8ClampedArray → Uint8Array に変換
          const uint8Array = new Uint8Array(imageData.data.buffer);

          // WASMで画像処理（リサイズ・エンコード）
          const thumbnailData = ImageProcessor.processImageData(
            canvas.width,
            canvas.height,
            uint8Array,
            options.width,
            options.height,
            options.format,
            options.quality
          );

          // Base64エンコードしてData URLに変換
          // 大きな配列の場合はチャンク処理
          let binary = '';
          const chunkSize = 8192;
          for (let i = 0; i < thumbnailData.length; i += chunkSize) {
            const chunk = thumbnailData.slice(i, i + chunkSize);
            binary += String.fromCharCode(...chunk);
          }
          const base64 = btoa(binary);
          const mimeType = options.format === 'png' ? 'image/png' :
                          options.format === 'webp' ? 'image/webp' : 'image/jpeg';

          results.push({
            url: `data:${mimeType};base64,${base64}`,
            width: options.width,
            height: options.height,
            page: pageNum,
            processingTime: performance.now() - pageStartTime
          });

          console.log(`✅ Page ${pageNum} generated in ${(performance.now() - pageStartTime).toFixed(2)}ms`);
        }
      } else {
        const pageStartTime = performance.now();

        // 単一ページのサムネイル生成
        const page = await pdf.getPage(options.page);
        const viewport = page.getViewport({ scale: options.scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas
        }).promise;

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        // Uint8ClampedArray → Uint8Array に変換
        const uint8Array = new Uint8Array(imageData.data.buffer);

        // WASMで画像処理
        const thumbnailData = ImageProcessor.processImageData(
          canvas.width,
          canvas.height,
          uint8Array,
          options.width,
          options.height,
          options.format,
          options.quality
        );

        // Base64エンコード（チャンク処理）
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < thumbnailData.length; i += chunkSize) {
          const chunk = thumbnailData.slice(i, i + chunkSize);
          binary += String.fromCharCode(...chunk);
        }
        const base64 = btoa(binary);
        const mimeType = options.format === 'png' ? 'image/png' :
                        options.format === 'webp' ? 'image/webp' : 'image/jpeg';

        results.push({
          url: `data:${mimeType};base64,${base64}`,
          width: options.width,
          height: options.height,
          page: options.page,
          processingTime: performance.now() - pageStartTime
        });
      }

      setThumbnails(results);
      console.log(`✅ Total processing time: ${(performance.now() - startTime).toFixed(2)}ms`);

    } catch (err) {
      console.error('Thumbnail generation error:', err);
      setError(`エラー: ${err}`);
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  }, [selectedFile, isWasmReady, options]);

  // ページ範囲パース
  const parsePageRange = (range: string, maxPage: number): number[] => {
    const pages: number[] = [];
    const parts = range.split(',');

    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        for (let i = start; i <= Math.min(end, maxPage); i++) {
          pages.push(i);
        }
      } else {
        const page = parseInt(part.trim());
        if (page <= maxPage) pages.push(page);
      }
    }

    return [...new Set(pages)].sort((a, b) => a - b);
  };

  // ダウンロード機能
  const downloadThumbnail = (result: ThumbnailResult) => {
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `thumbnail_page_${result.page}.${options.format}`;
    a.click();
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🖼️ PDF Thumbnail WASM Demo</h1>
        <p>高速PDFサムネイル生成 - pdf.js + WebAssembly</p>
      </header>

      <main className="main">
        {/* ファイル選択エリア */}
        <section className="upload-section">
          <label className="file-upload">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              disabled={!isWasmReady}
            />
            <div className="upload-button">
              {selectedFile ? (
                <span>📄 {selectedFile.name} ({pageCount} pages)</span>
              ) : (
                <span>PDFファイルを選択</span>
              )}
            </div>
          </label>
        </section>

        {/* オプション設定 */}
        <section className="options-section">
          <h3>⚙️ 生成オプション</h3>

          <div className="options-grid">
            <div className="option-group">
              <label>ページ番号</label>
              <input
                type="number"
                min="1"
                max={pageCount || 1}
                value={options.page}
                onChange={(e) => setOptions({...options, page: parseInt(e.target.value)})}
                disabled={options.multiplePages}
              />
            </div>

            <div className="option-group">
              <label>幅 (px)</label>
              <input
                type="number"
                min="50"
                max="2000"
                value={options.width}
                onChange={(e) => setOptions({...options, width: parseInt(e.target.value)})}
              />
            </div>

            <div className="option-group">
              <label>高さ (px)</label>
              <input
                type="number"
                min="50"
                max="2000"
                value={options.height}
                onChange={(e) => setOptions({...options, height: parseInt(e.target.value)})}
              />
            </div>

            <div className="option-group">
              <label>フォーマット</label>
              <select
                value={options.format}
                onChange={(e) => setOptions({...options, format: e.target.value as any})}
              >
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </div>

            <div className="option-group">
              <label>品質 (1-100)</label>
              <input
                type="range"
                min="1"
                max="100"
                value={options.quality}
                onChange={(e) => setOptions({...options, quality: parseInt(e.target.value)})}
              />
              <span>{options.quality}</span>
            </div>

            <div className="option-group">
              <label>
                <input
                  type="checkbox"
                  checked={options.multiplePages}
                  onChange={(e) => setOptions({...options, multiplePages: e.target.checked})}
                />
                複数ページ処理
              </label>
              {options.multiplePages && (
                <input
                  type="text"
                  placeholder="例: 1-3,5,7-10"
                  value={options.pageRange}
                  onChange={(e) => setOptions({...options, pageRange: e.target.value})}
                />
              )}
            </div>
          </div>

          <button
            className="generate-button"
            onClick={generateThumbnail}
            disabled={!selectedFile || !isWasmReady || isProcessing}
          >
            {isProcessing ? '生成中...' : 'サムネイル生成'}
          </button>

          {isProcessing && (
            <div className="progress">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
          )}
        </section>

        {/* エラー表示 */}
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* 結果表示 */}
        {thumbnails.length > 0 && (
          <section className="results-section">
            <h3>📸 生成結果</h3>
            <div className="thumbnails-grid">
              {thumbnails.map((result, index) => (
                <div key={index} className="thumbnail-card">
                  <img src={result.url} alt={`Page ${result.page}`} />
                  <div className="thumbnail-info">
                    <p>ページ {result.page}</p>
                    <p>{result.width} x {result.height}</p>
                    <p>⚡ {result.processingTime.toFixed(2)}ms</p>
                    <button onClick={() => downloadThumbnail(result)}>
                      💾 ダウンロード
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* パフォーマンス情報 */}
        <section className="benchmark-section">
          <h3>🚀 技術スタック</h3>
          <table>
            <tbody>
              <tr>
                <td>PDFレンダリング</td>
                <td>pdf.js (Mozilla)</td>
              </tr>
              <tr>
                <td>画像処理</td>
                <td>Rust + WebAssembly (image-rs)</td>
              </tr>
              <tr>
                <td>エンコード</td>
                <td>JPEG / PNG / WebP</td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>

      <footer className="footer">
        <p>Built with pdf.js 📄 + Rust 🦀 + WebAssembly 🌐</p>
      </footer>
    </div>
  );
};

export default App;
