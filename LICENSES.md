# Licenses

## tab-coach 本体

MIT License

Copyright (c) 2026 tabisurushosai

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 依存ライブラリ

本プロジェクトは完全オフラインの Chrome 拡張であり、ランタイム依存はゼロ。
以下は開発時 (devDependencies) のみで使用される OSS。

| ライブラリ | ライセンス | 用途 |
| --- | --- | --- |
| typescript | Apache-2.0 | 型チェック・コンパイル |
| vite | MIT | バンドラ |
| @types/chrome | MIT | Chrome 拡張 API 型定義 |
| vitest | MIT | テストランナー |
| jsdom | MIT | テスト用 DOM 環境 |
| eslint | MIT | リンタ |
| @typescript-eslint/parser | MIT | TypeScript 用 ESLint パーサ |
| @typescript-eslint/eslint-plugin | MIT | TypeScript 用 ESLint ルール |
| prettier | MIT | フォーマッタ |

実際の依存ツリーは `npm ls --all` で確認可能。
本ファイルは T085 (Phase 5) で license-checker 等を用いて完全版に更新する。

## アイコン・画像

`icons/` および `assets/` 配下の画像は本プロジェクトオリジナル (CC0 相当)。

## 第三者素材

本プロジェクトでは第三者の画像・フォント・アイコン素材を使用していない。
