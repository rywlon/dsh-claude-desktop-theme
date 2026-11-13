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

上游 0.10.5 起包含 `.github/workflows/host-compat.yml`（真实宿主冒烟 CI）。本 fork 暂未纳入该文件：本机 `gh` token 只有 `gist`、`read:org`、`repo` scope，推送会因缺少 `workflow` scope 被 GitHub 拒绝。要启用时，先去 GitHub 网页端手工添加该文件（或执行 `gh auth refresh -h github.com -s workflow` 后再推送），然后运行 `npm run test:host`。

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

真实宿主冒烟（会启动本机 `/Applications` 里的 DSH Desktop，用一次性 `DSH_HOME`，不碰日常 profile）：

```sh
npm run test:host -- --tarball <刚才 pack 出来的 tgz>
```

本机若已登录过 DSH Desktop，凭据在系统钥匙串里、会延续到一次性 profile，模型目录因此非空；脚本已兼容“空目录 / 有模型”两种状态。

## 安装到本地 DSH

源码安装流程见 [install.md](install.md)。要点是 `npm run pack:local --cache .cache/npm` 打出唯一路径的 tarball，再用桌面版内置 CLI 安装到 `desktop` profile：

```sh
"${DSH_CCD_APP:-/Applications/DeepSeek Harness.app}/Contents/Resources/runtime/cli/bin/dsh" \
  plugin --profile desktop add <tarball>
```

安装和升级会写 `~/.dsh/profiles/desktop`，装完完整退出并重开 DSH。本地 profile 同时只应启用一个 Claude 风格主题，和别的主题插件并存前先确认不会互相抢注入点。

本机当前安装的是 `~/.dsh/theme-tarballs/dsh-claude-desktop-theme-0.10.7.tgz`，profile 依赖记为指向该 tarball 的 `file:` 路径；本地同时保留一份源码检出在 `~/Developer/dsh-claude-desktop-theme`（`origin` 可推、`upstream` 指上游），日常改动都在检出里做。每次改动后的循环：

1. 跑上面的非浏览器验证；完整 `npm test` 依赖 Chrome，本机受限环境起不来时以 CI 为准。
2. 先改 `package.json` 的版本号再构建——版本号会编进构建产物。
3. 打包：正常情况下 `npm run pack:local --cache .cache/npm`（`prepack` 会跑完整 `npm run check`）；本机跳过浏览器用例时改用 `npm run build && npm pack --ignore-scripts --cache .cache/npm --pack-destination /tmp/theme-pack`。
4. 把 tarball 放进 `~/.dsh/theme-tarballs/`，按上面的 CLI 命令 add 一次，再完整退出并重开 DSH。
5. 提交并 push 到 `origin main`，等 GitHub Actions 的 `npm run check` 通过。

改动前先备份 profile 的 `cordis.patch.yml` 和 `package.json`：旧配置里可能残留同一 id（`ui-skin-ccd-style`）的条目，会覆盖插件的默认配置。安装完还要把包名加进 profile `package.json` 的 `dsh.profile.bundles` 才会被加载。

## 发布

npm 上的 `dsh-claude-desktop-theme` 包名归上游所有，不能直接往上发。决定自行发布前要先把包名改掉，涉及：

- `package.json` 的 `name`、`repository`、`homepage`、`bugs`
- `cordis.patch.yml` 里的 `name`
- `src/shared/identity.ts` 的 `PLUGIN_ID`（改它会让已有配置失效，需要迁移）
- `src/client/compat/plugin-feedback.ts` 的 `FEEDBACK_ISSUE_URL`、`src/client/compat/account-more.ts` 里的 GitHub 链接
- `scripts/check-architecture.mjs` 的 `RAW_PREFIX`，以及 README / install.md 里的包名与链接

改名前直接用本地 tarball 安装即可。
