# 维护说明

本仓库是 [zkforge/dsh-claude-desktop-theme](https://github.com/zkforge/dsh-claude-desktop-theme) 的维护分支（`rywlon/dsh-claude-desktop-theme`），在保留上游 MIT 许可与原作者署名（见 [LICENSE](LICENSE)）的前提下按自己的需要修改主题。

## 远端与同步上游

- `origin`：本 fork，可推送
- `upstream`：上游

```sh
git fetch upstream
git merge upstream/main
```

尽量少改上游原有文件，把自有改动集中成独立提交或放在单独文件里，方便持续合并上游；发版、CI、文档口径都沿用上游约定（[AGENTS.md](AGENTS.md)）。

README 与其它文档里的绝对链接仍指向上游仓库：这样 fork 的文档保持一致，也满足 [scripts/check-architecture.mjs](scripts/check-architecture.mjs) 里写死的 `zkforge` raw 前缀。要把文档改指本 fork 时，需同步修改该脚本的 `RAW_PREFIX`。

## 本地验证

```sh
npm ci --cache .cache/npm
npm run typecheck
npm run check:architecture
node --test tests/*.test.ts
npm run build
npm run check:package
```

完整的 `npm run check` 还包含浏览器用例：需要本机可用的 Chrome，受限环境里 headless Chrome 可能起不来而超时，这时先跑上面的非浏览器步骤，完整校验以 GitHub Actions（push 到 `main` 时运行）为准。

## 安装到本地 DSH

源码安装流程见 [install.md](install.md)。要点是 `npm run pack:local --cache .cache/npm` 打出唯一路径的 tarball，再用桌面版内置 CLI 安装到 `desktop` profile：

```sh
"${DSH_CCD_APP:-/Applications/DeepSeek Harness.app}/Contents/Resources/runtime/cli/bin/dsh" \
  plugin --profile desktop add <tarball>
```

安装和升级会写 `~/.dsh/profiles/desktop`，装完完整退出并重开 DSH。本地 profile 同时只应启用一个 Claude 风格主题，和别的主题插件并存前先确认不会互相抢注入点。

本机当前安装的是 `~/.dsh/theme-tarballs/dsh-claude-desktop-theme-0.10.4.tgz`，profile 依赖记为指向该 tarball 的 `file:` 路径；升级时把新 tarball 放进同一目录再 add 一次即可，源码仓库不必留在本地。改动前先备份 profile 的 `cordis.patch.yml` 和 `package.json`：旧配置里可能残留同一 id（`ui-skin-ccd-style`）的条目，会覆盖插件的默认配置。安装完还要把包名加进 profile `package.json` 的 `dsh.profile.bundles` 才会被加载。

## 发布

npm 上的 `dsh-claude-desktop-theme` 包名归上游所有，不能直接往上发。决定自行发布前要先把包名改掉，涉及：

- `package.json` 的 `name`、`repository`、`homepage`、`bugs`
- `cordis.patch.yml` 里的 `name`
- `src/shared/identity.ts` 的 `PLUGIN_ID`（改它会让已有配置失效，需要迁移）
- `src/client/compat/plugin-feedback.ts` 的 `FEEDBACK_ISSUE_URL`、`src/client/compat/account-more.ts` 里的 GitHub 链接
- `scripts/check-architecture.mjs` 的 `RAW_PREFIX`，以及 README / install.md 里的包名与链接

改名前直接用本地 tarball 安装即可。
