# Rustの公式イメージをベースに使用
FROM rust:1.75-bookworm

# 環境変数の設定
ENV DEBIAN_FRONTEND=noninteractive
ENV CARGO_HOME=/usr/local/cargo
ENV RUSTUP_HOME=/usr/local/rustup
ENV PATH=$CARGO_HOME/bin:$PATH

# 作業ユーザーの設定
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# 必要なパッケージのインストール
RUN apt-get update && apt-get install -y \
    # 基本ツール
    git \
    curl \
    wget \
    vim \
    sudo \
    # ビルドツール
    build-essential \
    pkg-config \
    libssl-dev \
    # デバッグツール
    gdb \
    lldb \
    # その他のユーティリティ
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Node.js 18.xのインストール
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# pnpmのインストール
RUN npm install -g pnpm

# Rustのターゲット追加
RUN rustup target add wasm32-unknown-unknown

# wasm-packのインストール
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# cargo-watchのインストール（オプション）
RUN cargo install cargo-watch

# rustfmtとclippyのインストール
RUN rustup component add rustfmt clippy

# 非rootユーザーの作成
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

# Cargoディレクトリのパーミッション設定
RUN chown -R $USERNAME:$USERNAME $CARGO_HOME $RUSTUP_HOME

# デフォルトユーザーを設定
USER $USERNAME

# 作業ディレクトリを設定
WORKDIR /workspace

# ヘルスチェック用のラベル
LABEL maintainer="pdf-thumbnail-wasm"
LABEL description="Development container for pdf-thumbnail-wasm project"

# デフォルトのシェルをbashに設定
ENV SHELL=/bin/bash

# ウェルカムメッセージ
RUN echo 'echo "🦀 PDF Thumbnail WASM Development Environment"' >> ~/.bashrc \
    && echo 'echo "Rust: $(rustc --version)"' >> ~/.bashrc \
    && echo 'echo "Node.js: $(node --version)"' >> ~/.bashrc \
    && echo 'echo "pnpm: $(pnpm --version)"' >> ~/.bashrc \
    && echo 'echo "wasm-pack: $(wasm-pack --version)"' >> ~/.bashrc \
    && echo 'echo ""' >> ~/.bashrc \
    && echo 'echo "Quick start:"' >> ~/.bashrc \
    && echo 'echo "  pnpm install          # 依存関係をインストール"' >> ~/.bashrc \
    && echo 'echo "  pnpm run build:wasm   # WASMモジュールをビルド"' >> ~/.bashrc \
    && echo 'echo "  pnpm run example      # デモアプリを起動"' >> ~/.bashrc \
    && echo 'echo "  cargo test            # Rustテストを実行"' >> ~/.bashrc \
    && echo 'echo ""' >> ~/.bashrc
