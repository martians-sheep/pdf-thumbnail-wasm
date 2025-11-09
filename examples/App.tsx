import React, { useState, useCallback, useEffect } from 'react';
import './style.css';
import init, { PdfThumbnail } from '../pkg/pdf_thumbnail_wasm.js';

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
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
      setThumbnails([]);
    } else {
      setError('PDFファイルを選択してください');
    }
  };

  // サムネイル生成処理（WASM実装）
  const generateThumbnail = useCallback(async () => {
    if (!selectedFile || !isWasmReady) return;

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    let processor: PdfThumbnail | null = null;

    try {
      const startTime = performance.now();

      console.log('📄 Processing PDF:', selectedFile.name);

      // PDFデータを読み込んでWASM処理クラスを初期化
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);
      processor = new PdfThumbnail(pdfData);
      const pageCount = processor.getPageCount();

      console.log(`📊 Page count: ${pageCount}`);

      const results: ThumbnailResult[] = [];

      if (options.multiplePages) {
        const pages = parsePageRange(options.pageRange, pageCount);

        for (let i = 0; i < pages.length; i++) {
          setProgress((i + 1) / pages.length * 100);

          const pageStartTime = performance.now();

          // WASM経由でサムネイルを生成
          const thumbnailData = await processor.generateThumbnail({
            page: pages[i],
            width: options.width,
            height: options.height,
            format: options.format,
            quality: options.quality,
            scale: options.scale
          });

          // バイナリデータをBase64エンコードしてData URLに変換
          const base64 = btoa(String.fromCharCode(...thumbnailData));
          const mimeType = options.format === 'png' ? 'image/png' :
                          options.format === 'webp' ? 'image/webp' : 'image/jpeg';

          results.push({
            url: `data:${mimeType};base64,${base64}`,
            width: options.width,
            height: options.height,
            page: pages[i],
            processingTime: performance.now() - pageStartTime
          });

          console.log(`✅ Page ${pages[i]} generated in ${(performance.now() - pageStartTime).toFixed(2)}ms`);
        }
      } else {
        const pageStartTime = performance.now();

        // 単一ページのサムネイル生成
        const thumbnailData = await processor.generateThumbnail({
          page: options.page,
          width: options.width,
          height: options.height,
          format: options.format,
          quality: options.quality,
          scale: options.scale
        });

        const base64 = btoa(String.fromCharCode(...thumbnailData));
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
      // メモリ解放
      if (processor) {
        processor.dispose();
      }
      setIsProcessing(false);
      setProgress(100);
    }
  }, [selectedFile, isWasmReady, options]);

  // プレースホルダーSVG生成
  const createPlaceholderSvg = (width: number, height: number, page: number): string => {
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <rect x="10" y="10" width="${width-20}" height="${height-20}" fill="white" stroke="#ddd" stroke-width="2"/>
      <text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="24" fill="#999">
        Page ${page} Placeholder
      </text>
      <text x="50%" y="60%" text-anchor="middle" font-family="Arial" font-size="14" fill="#bbb">
        Run 'npm run build:wasm' to enable real rendering
      </text>
    </svg>`;
  };

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
        <p>高速PDFサムネイル生成 - WebAssembly実装</p>
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
                <span>📄 {selectedFile.name}</span>
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

        {/* パフォーマンス比較 */}
        <section className="benchmark-section">
          <h3>🚀 パフォーマンス比較（目標値）</h3>
          <table>
            <thead>
              <tr>
                <th>ライブラリ</th>
                <th>1ページ処理時間</th>
                <th>メモリ使用量</th>
              </tr>
            </thead>
            <tbody>
              <tr className="highlight">
                <td>pdf-thumbnail-wasm (This)</td>
                <td>~50ms</td>
                <td>~50MB</td>
              </tr>
              <tr>
                <td>pdfjs-dist</td>
                <td>~150ms</td>
                <td>~200MB</td>
              </tr>
              <tr>
                <td>canvas + pdfjs</td>
                <td>~200ms</td>
                <td>~250MB</td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>

      <footer className="footer">
        <p>Built with Rust 🦀 + WebAssembly 🌐</p>
      </footer>
    </div>
  );
};

export default App;
