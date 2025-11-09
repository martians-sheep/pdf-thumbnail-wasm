# Development Setup Guide

This guide will help you set up the development environment for pdf-thumbnail-wasm.

## Prerequisites

### Required Tools

1. **Rust** (1.70 or higher)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup target add wasm32-unknown-unknown
   ```

2. **wasm-pack**
   ```bash
   curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
   ```

3. **Node.js** (16.0.0 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Or use [nvm](https://github.com/nvm-sh/nvm):
     ```bash
     nvm install 18
     nvm use 18
     ```

4. **pnpm** (recommended) or npm
   ```bash
   npm install -g pnpm
   ```

### Optional Tools

- **VS Code** with recommended extensions (see `.vscode/extensions.json`)
- **Rust Analyzer** for IDE support
- **cargo-watch** for auto-rebuild:
  ```bash
  cargo install cargo-watch
  ```

## Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/martians-sheep/pdf-thumbnail-wasm.git
   cd pdf-thumbnail-wasm
   ```

2. **Install Node.js dependencies**
   ```bash
   pnpm install
   ```

3. **Build WASM module**
   ```bash
   # Build for all targets
   pnpm run build:all

   # Or build for specific targets
   pnpm run build:wasm      # Web
   pnpm run build:node      # Node.js
   pnpm run build:bundler   # Bundler
   ```

4. **Verify setup**
   ```bash
   # Run tests
   pnpm test

   # Run Rust tests
   cargo test

   # Check formatting
   cargo fmt -- --check

   # Run clippy
   cargo clippy -- -D warnings
   ```

## Development Workflow

### Running the Example

1. **Add a sample PDF** to the `public/` directory:
   ```bash
   cp /path/to/your/sample.pdf public/sample.pdf
   ```

2. **Start development server**:
   ```bash
   pnpm run example
   ```

3. **Open browser** to http://localhost:5173

### Making Changes

1. **Edit Rust code** in `src/`:
   ```bash
   # Auto-rebuild on changes
   cargo watch -x 'build --target wasm32-unknown-unknown'
   ```

2. **Rebuild WASM**:
   ```bash
   pnpm run build:wasm
   ```

3. **Reload browser** to see changes

### Testing

```bash
# Run all tests
pnpm test

# Run Rust tests
cargo test

# Run Rust tests with output
cargo test -- --nocapture

# Run specific test
cargo test test_name

# Run JS tests in watch mode
pnpm run test:watch

# Run tests with UI
pnpm run test:ui

# Run WASM tests in browser
pnpm run test:wasm
```

### Benchmarking

```bash
# Run Rust benchmarks
cargo bench

# Run specific benchmark
cargo bench bench_name
```

### Linting and Formatting

```bash
# Format Rust code
cargo fmt

# Check formatting
cargo fmt -- --check

# Run clippy
cargo clippy

# Run clippy with warnings as errors
cargo clippy -- -D warnings
```

## Project Structure

```
pdf-thumbnail-wasm/
├── .github/              # GitHub Actions workflows
├── .vscode/              # VS Code settings
├── benches/              # Rust benchmarks
├── examples/             # Demo application
│   ├── index.html       # Entry HTML
│   ├── App.tsx          # React demo app
│   └── style.css        # Styles
├── js/                   # TypeScript wrappers
│   ├── index.ts         # Main exports
│   ├── types.d.ts       # Type definitions
│   ├── browser.ts       # Browser utilities
│   └── node.ts          # Node.js utilities
├── public/               # Public assets
├── src/                  # Rust source code
│   ├── lib.rs           # Main entry point
│   ├── pdf_renderer.rs  # PDF rendering
│   ├── image_processor.rs # Image processing
│   ├── types.rs         # Type definitions
│   └── utils.rs         # Utilities
├── tests/                # Test files
├── pkg/                  # WASM build output (web)
├── pkg-node/            # WASM build output (node)
├── pkg-bundler/         # WASM build output (bundler)
├── Cargo.toml           # Rust configuration
├── package.json         # Node.js configuration
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── vitest.config.ts     # Vitest configuration
```

## Build Outputs

After running `pnpm run build:all`, you'll have:

- **pkg/** - Web target (ES modules)
- **pkg-node/** - Node.js target (CommonJS)
- **pkg-bundler/** - Bundler target (for webpack, rollup, etc.)

Each directory contains:
- `*.wasm` - WebAssembly binary
- `*.js` - JavaScript bindings
- `*.d.ts` - TypeScript definitions
- `package.json` - Package metadata

## Common Issues

### WASM build fails

**Problem**: `wasm-pack build` fails with compilation errors

**Solution**:
```bash
# Clean build cache
cargo clean

# Update Rust
rustup update

# Rebuild
pnpm run build:wasm
```

### Module not found errors

**Problem**: Import errors when running examples

**Solution**:
```bash
# Ensure WASM is built
pnpm run build:wasm

# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
pnpm run example
```

### Tests failing

**Problem**: Tests fail after making changes

**Solution**:
```bash
# Rebuild WASM
pnpm run build:all

# Run tests
pnpm test
```

## Next Steps

- Read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- Check [README.md](README.md) for API documentation
- Explore the [examples/](examples/) directory for usage examples
- Join discussions in [GitHub Discussions](https://github.com/martians-sheep/pdf-thumbnail-wasm/discussions)

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/martians-sheep/pdf-thumbnail-wasm/issues)
- **Discussions**: [GitHub Discussions](https://github.com/martians-sheep/pdf-thumbnail-wasm/discussions)
- **Documentation**: [README.md](README.md)
