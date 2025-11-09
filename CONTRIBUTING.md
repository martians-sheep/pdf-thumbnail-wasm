# Contributing to pdf-thumbnail-wasm

Thank you for your interest in contributing to pdf-thumbnail-wasm! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

### Prerequisites

- Rust 1.70 or higher
- Node.js 16 or higher
- wasm-pack
- pnpm (recommended) or npm

### Development Setup

1. Fork and clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/pdf-thumbnail-wasm.git
cd pdf-thumbnail-wasm
```

2. Install dependencies:
```bash
# Install Node.js dependencies
pnpm install

# Build WASM module
pnpm run build:wasm
```

3. Run tests:
```bash
# Run all tests
pnpm test

# Run Rust tests only
cargo test

# Run JavaScript tests only
pnpm run test:js
```

4. Start development server:
```bash
pnpm run example
```

## Development Workflow

### Project Structure

```
pdf-thumbnail-wasm/
├── src/                 # Rust source code
│   ├── lib.rs          # Main entry point
│   ├── pdf_renderer.rs # PDF rendering logic
│   ├── image_processor.rs # Image processing
│   └── types.rs        # Type definitions
├── js/                 # TypeScript wrappers
├── examples/           # Demo application
├── tests/              # Test files
└── benches/            # Benchmark files
```

### Making Changes

1. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes:
   - Write clean, documented code
   - Follow Rust and TypeScript best practices
   - Add tests for new functionality
   - Update documentation as needed

3. Run linting and formatting:
```bash
# Format Rust code
cargo fmt

# Lint Rust code
cargo clippy -- -D warnings

# Run tests
pnpm test
```

4. Commit your changes:
```bash
git add .
git commit -m "feat: add your feature description"
```

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Build process or auxiliary tool changes

5. Push and create a pull request:
```bash
git push origin feature/your-feature-name
```

## Pull Request Process

1. **Update Documentation**: Ensure README.md and other docs are updated
2. **Add Tests**: All new features should have corresponding tests
3. **Pass CI**: Ensure all CI checks pass
4. **Code Review**: Wait for maintainer review and address feedback
5. **Squash Commits**: Maintainers may squash commits before merging

## Testing Guidelines

### Rust Tests

```bash
# Run all Rust tests
cargo test

# Run specific test
cargo test test_name

# Run tests with output
cargo test -- --nocapture
```

### JavaScript/TypeScript Tests

```bash
# Run all JS tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with UI
pnpm run test:ui
```

### WASM Tests

```bash
# Test in headless browser
pnpm run test:wasm
```

## Benchmarking

```bash
# Run Rust benchmarks
cargo bench

# Run JavaScript benchmarks
pnpm run bench
```

## Performance Considerations

When contributing performance-sensitive code:

1. **Profile First**: Use `cargo bench` to establish baseline
2. **Measure Impact**: Verify performance improvements with benchmarks
3. **Memory Usage**: Monitor WASM binary size and runtime memory
4. **Document Trade-offs**: Explain any complexity vs. performance trade-offs

## Documentation

- Use Rust doc comments (`///`) for public APIs
- Use JSDoc for TypeScript code
- Update README.md for user-facing changes
- Add examples for new features

Example Rust documentation:
```rust
/// Generate a thumbnail for a PDF page
///
/// # Arguments
/// * `page` - Page number (1-indexed)
/// * `width` - Output width in pixels
///
/// # Returns
/// Image data as `Vec<u8>`
///
/// # Examples
/// ```
/// let thumbnail = processor.generate_thumbnail(1, 400)?;
/// ```
pub fn generate_thumbnail(&self, page: u32, width: u32) -> Result<Vec<u8>, Error> {
    // ...
}
```

## Issue Guidelines

### Reporting Bugs

Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs. actual behavior
- Environment (OS, browser, Node.js version)
- Code samples or screenshots

### Requesting Features

Include:
- Clear use case description
- Proposed API (if applicable)
- Examples of similar features in other libraries
- Willingness to contribute implementation

## Questions?

- Open a [Discussion](https://github.com/martians-sheep/pdf-thumbnail-wasm/discussions)
- Check existing [Issues](https://github.com/martians-sheep/pdf-thumbnail-wasm/issues)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
