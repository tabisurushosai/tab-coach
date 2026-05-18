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

## ランタイム依存

本プロジェクトは Manifest V3 の Chrome 拡張で、すべての処理がユーザー端末内で完結する。
バンドル後の `dist/` には外部 OSS のランタイム依存を一切含まない (production dependencies = 0)。
したがって配布物に同梱される第三者著作物は存在しない。

## 開発時依存 (devDependencies) ライセンス一覧

以下は `npm install` 時に取得される全 dev 依存 (推移的依存を含む) の SPDX ライセンス識別子。
本ファイルは `npx license-checker --json` の出力を元に生成 (生成日: 2026-05-18)。

### ライセンス内訳

| ライセンス | 件数 |
| --- | ---: |
| MIT | 184 |
| ISC | 19 |
| Apache-2.0 | 8 |
| BSD-2-Clause | 8 |
| BSD-3-Clause | 4 |
| MIT-0 | 1 |
| BlueOak-1.0.0 | 1 |
| Python-2.0 | 1 |
| (MIT OR CC0-1.0) | 1 |
| **合計** | **227** |

すべて OSI 認定または同等のパーミッシブライセンス。GPL/AGPL/コピーレフト系は 0 件。

### パッケージ一覧 (227)

| パッケージ | バージョン | ライセンス |
| --- | --- | --- |
| @asamuzakjp/css-color | 3.2.0 | MIT |
| @csstools/color-helpers | 5.1.0 | MIT-0 |
| @csstools/css-calc | 2.1.4 | MIT |
| @csstools/css-color-parser | 3.1.0 | MIT |
| @csstools/css-parser-algorithms | 3.0.5 | MIT |
| @csstools/css-tokenizer | 3.0.4 | MIT |
| @esbuild/darwin-arm64 | 0.21.5 | MIT |
| @eslint-community/eslint-utils | 4.9.1 | MIT |
| @eslint-community/regexpp | 4.12.2 | MIT |
| @eslint/eslintrc | 2.1.4 | MIT |
| @eslint/js | 8.57.1 | MIT |
| @humanwhocodes/config-array | 0.13.0 | Apache-2.0 |
| @humanwhocodes/module-importer | 1.0.1 | Apache-2.0 |
| @humanwhocodes/object-schema | 2.0.3 | BSD-3-Clause |
| @jridgewell/sourcemap-codec | 1.5.5 | MIT |
| @nodelib/fs.scandir | 2.1.5 | MIT |
| @nodelib/fs.stat | 2.0.5 | MIT |
| @nodelib/fs.walk | 1.2.8 | MIT |
| @rollup/rollup-darwin-arm64 | 4.60.4 | MIT |
| @types/chrome | 0.0.270 | MIT |
| @types/estree | 1.0.8 | MIT |
| @types/filesystem | 0.0.36 | MIT |
| @types/filewriter | 0.0.33 | MIT |
| @types/har-format | 1.2.16 | MIT |
| @types/node | 25.8.0 | MIT |
| @typescript-eslint/eslint-plugin | 8.59.3 | MIT |
| @typescript-eslint/parser | 8.59.3 | MIT |
| @typescript-eslint/project-service | 8.59.3 | MIT |
| @typescript-eslint/scope-manager | 8.59.3 | MIT |
| @typescript-eslint/tsconfig-utils | 8.59.3 | MIT |
| @typescript-eslint/type-utils | 8.59.3 | MIT |
| @typescript-eslint/types | 8.59.3 | MIT |
| @typescript-eslint/typescript-estree | 8.59.3 | MIT |
| @typescript-eslint/utils | 8.59.3 | MIT |
| @typescript-eslint/visitor-keys | 8.59.3 | MIT |
| @ungap/structured-clone | 1.3.1 | ISC |
| @vitest/expect | 2.1.9 | MIT |
| @vitest/mocker | 2.1.9 | MIT |
| @vitest/pretty-format | 2.1.9 | MIT |
| @vitest/runner | 2.1.9 | MIT |
| @vitest/snapshot | 2.1.9 | MIT |
| @vitest/spy | 2.1.9 | MIT |
| @vitest/utils | 2.1.9 | MIT |
| acorn | 8.16.0 | MIT |
| acorn-jsx | 5.3.2 | MIT |
| agent-base | 7.1.4 | MIT |
| ajv | 6.15.0 | MIT |
| ansi-regex | 5.0.1 | MIT |
| ansi-styles | 4.3.0 | MIT |
| argparse | 2.0.1 | Python-2.0 |
| assertion-error | 2.0.1 | MIT |
| asynckit | 0.4.0 | MIT |
| balanced-match | 1.0.2 | MIT |
| balanced-match | 4.0.4 | MIT |
| brace-expansion | 1.1.14 | MIT |
| brace-expansion | 5.0.6 | MIT |
| cac | 6.7.14 | MIT |
| call-bind-apply-helpers | 1.0.2 | MIT |
| callsites | 3.1.0 | MIT |
| chai | 5.3.3 | MIT |
| chalk | 4.1.2 | MIT |
| check-error | 2.1.3 | MIT |
| color-convert | 2.0.1 | MIT |
| color-name | 1.1.4 | MIT |
| combined-stream | 1.0.8 | MIT |
| concat-map | 0.0.1 | MIT |
| cross-spawn | 7.0.6 | MIT |
| cssstyle | 4.6.0 | MIT |
| data-urls | 5.0.0 | MIT |
| debug | 4.4.3 | MIT |
| decimal.js | 10.6.0 | MIT |
| deep-eql | 5.0.2 | MIT |
| deep-is | 0.1.4 | MIT |
| delayed-stream | 1.0.0 | MIT |
| doctrine | 3.0.0 | Apache-2.0 |
| dunder-proto | 1.0.1 | MIT |
| entities | 6.0.1 | BSD-2-Clause |
| es-define-property | 1.0.1 | MIT |
| es-errors | 1.3.0 | MIT |
| es-module-lexer | 1.7.0 | MIT |
| es-object-atoms | 1.1.1 | MIT |
| es-set-tostringtag | 2.1.0 | MIT |
| esbuild | 0.21.5 | MIT |
| escape-string-regexp | 4.0.0 | MIT |
| eslint | 8.57.1 | MIT |
| eslint-config-prettier | 10.1.8 | MIT |
| eslint-scope | 7.2.2 | BSD-2-Clause |
| eslint-visitor-keys | 3.4.3 | Apache-2.0 |
| eslint-visitor-keys | 5.0.1 | Apache-2.0 |
| espree | 9.6.1 | BSD-2-Clause |
| esquery | 1.7.0 | BSD-3-Clause |
| esrecurse | 4.3.0 | BSD-2-Clause |
| estraverse | 5.3.0 | BSD-2-Clause |
| estree-walker | 3.0.3 | MIT |
| esutils | 2.0.3 | BSD-2-Clause |
| expect-type | 1.3.0 | Apache-2.0 |
| fast-deep-equal | 3.1.3 | MIT |
| fast-json-stable-stringify | 2.1.0 | MIT |
| fast-levenshtein | 2.0.6 | MIT |
| fastq | 1.20.1 | ISC |
| fdir | 6.5.0 | MIT |
| file-entry-cache | 6.0.1 | MIT |
| find-up | 5.0.0 | MIT |
| flat-cache | 3.2.0 | MIT |
| flatted | 3.4.2 | ISC |
| form-data | 4.0.5 | MIT |
| fs.realpath | 1.0.0 | ISC |
| fsevents | 2.3.3 | MIT |
| function-bind | 1.1.2 | MIT |
| get-intrinsic | 1.3.0 | MIT |
| get-proto | 1.0.1 | MIT |
| glob | 7.2.3 | ISC |
| glob-parent | 6.0.2 | ISC |
| globals | 13.24.0 | MIT |
| gopd | 1.2.0 | MIT |
| graphemer | 1.4.0 | MIT |
| has-flag | 4.0.0 | MIT |
| has-symbols | 1.1.0 | MIT |
| has-tostringtag | 1.0.2 | MIT |
| hasown | 2.0.3 | MIT |
| html-encoding-sniffer | 4.0.0 | MIT |
| http-proxy-agent | 7.0.2 | MIT |
| https-proxy-agent | 7.0.6 | MIT |
| iconv-lite | 0.6.3 | MIT |
| ignore | 5.3.2 | MIT |
| ignore | 7.0.5 | MIT |
| import-fresh | 3.3.1 | MIT |
| imurmurhash | 0.1.4 | MIT |
| inflight | 1.0.6 | ISC |
| inherits | 2.0.4 | ISC |
| is-extglob | 2.1.1 | MIT |
| is-glob | 4.0.3 | MIT |
| is-path-inside | 3.0.3 | MIT |
| is-potential-custom-element-name | 1.0.1 | MIT |
| isexe | 2.0.0 | ISC |
| js-yaml | 4.1.1 | MIT |
| jsdom | 25.0.1 | MIT |
| json-buffer | 3.0.1 | MIT |
| json-schema-traverse | 0.4.1 | MIT |
| json-stable-stringify-without-jsonify | 1.0.1 | MIT |
| keyv | 4.5.4 | MIT |
| levn | 0.4.1 | MIT |
| locate-path | 6.0.0 | MIT |
| lodash.merge | 4.6.2 | MIT |
| loupe | 3.2.1 | MIT |
| lru-cache | 10.4.3 | ISC |
| magic-string | 0.30.21 | MIT |
| math-intrinsics | 1.1.0 | MIT |
| mime-db | 1.52.0 | MIT |
| mime-types | 2.1.35 | MIT |
| minimatch | 10.2.5 | BlueOak-1.0.0 |
| minimatch | 3.1.5 | ISC |
| ms | 2.1.3 | MIT |
| nanoid | 3.3.12 | MIT |
| natural-compare | 1.4.0 | MIT |
| nwsapi | 2.2.23 | MIT |
| once | 1.4.0 | ISC |
| optionator | 0.9.4 | MIT |
| p-limit | 3.1.0 | MIT |
| p-locate | 5.0.0 | MIT |
| parent-module | 1.0.1 | MIT |
| parse5 | 7.3.0 | MIT |
| path-exists | 4.0.0 | MIT |
| path-is-absolute | 1.0.1 | MIT |
| path-key | 3.1.1 | MIT |
| pathe | 1.1.2 | MIT |
| pathval | 2.0.1 | MIT |
| picocolors | 1.1.1 | ISC |
| picomatch | 4.0.4 | MIT |
| postcss | 8.5.14 | MIT |
| prelude-ls | 1.2.1 | MIT |
| prettier | 3.8.3 | MIT |
| punycode | 2.3.1 | MIT |
| queue-microtask | 1.2.3 | MIT |
| resolve-from | 4.0.0 | MIT |
| reusify | 1.1.0 | MIT |
| rimraf | 3.0.2 | ISC |
| rollup | 4.60.4 | MIT |
| rrweb-cssom | 0.7.1 | MIT |
| rrweb-cssom | 0.8.0 | MIT |
| run-parallel | 1.2.0 | MIT |
| safer-buffer | 2.1.2 | MIT |
| saxes | 6.0.0 | ISC |
| semver | 7.8.0 | ISC |
| shebang-command | 2.0.0 | MIT |
| shebang-regex | 3.0.0 | MIT |
| siginfo | 2.0.0 | ISC |
| source-map-js | 1.2.1 | BSD-3-Clause |
| stackback | 0.0.2 | MIT |
| std-env | 3.10.0 | MIT |
| strip-ansi | 6.0.1 | MIT |
| strip-json-comments | 3.1.1 | MIT |
| supports-color | 7.2.0 | MIT |
| symbol-tree | 3.2.4 | MIT |
| text-table | 0.2.0 | MIT |
| tinybench | 2.9.0 | MIT |
| tinyexec | 0.3.2 | MIT |
| tinyglobby | 0.2.16 | MIT |
| tinypool | 1.1.1 | MIT |
| tinyrainbow | 1.2.0 | MIT |
| tinyspy | 3.0.2 | MIT |
| tldts | 6.1.86 | MIT |
| tldts-core | 6.1.86 | MIT |
| tough-cookie | 5.1.2 | BSD-3-Clause |
| tr46 | 5.1.1 | MIT |
| ts-api-utils | 2.5.0 | MIT |
| type-check | 0.4.0 | MIT |
| type-fest | 0.20.2 | (MIT OR CC0-1.0) |
| typescript | 5.9.3 | Apache-2.0 |
| undici-types | 7.24.6 | MIT |
| uri-js | 4.4.1 | BSD-2-Clause |
| vite | 5.4.21 | MIT |
| vite-node | 2.1.9 | MIT |
| vitest | 2.1.9 | MIT |
| w3c-xmlserializer | 5.0.0 | MIT |
| webidl-conversions | 7.0.0 | BSD-2-Clause |
| whatwg-encoding | 3.1.1 | MIT |
| whatwg-mimetype | 4.0.0 | MIT |
| whatwg-url | 14.2.0 | MIT |
| which | 2.0.2 | ISC |
| why-is-node-running | 2.3.0 | MIT |
| word-wrap | 1.2.5 | MIT |
| wrappy | 1.0.2 | ISC |
| ws | 8.20.1 | MIT |
| xml-name-validator | 5.0.0 | Apache-2.0 |
| xmlchars | 2.2.0 | MIT |
| yocto-queue | 0.1.0 | MIT |
## アイコン・画像

`icons/` および `assets/` 配下の画像は本プロジェクトオリジナル (CC0 相当)。
フォント・絵文字素材は使用していない。

## 第三者素材

配布物 (.zip / dist/) には第三者の画像・フォント・アイコン・コード片を一切含まない。

## 再生成

依存ライブラリを追加・更新した際は以下で本ファイルを再生成すること:

```bash
npx license-checker --json > /tmp/licenses.json
# その後 LICENSES.md の表を更新
```

## 報告

ライセンス違反・帰属漏れを発見した場合は GitHub Issues (security ラベル) で報告してください。
