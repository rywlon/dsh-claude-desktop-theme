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

README 与其它文档里的绝对链接指向本 fork（`rywlon/dsh-claude-desktop-theme`），[scripts/check-architecture.mjs](scripts/check-architecture.mjs) 的 `RAW_PREFIX` 也同步指向本 fork；上游仓库只在 README 的出处说明与 git remote 里出现。

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

本机当前安装的是 `~/.dsh/theme-tarballs/dsh-claude-desktop-theme-0.10.17.tgz`，profile 依赖记为指向该 tarball 的 `file:` 路径；本地同时保留一份源码检出在 `~/Developer/dsh-claude-desktop-theme`（`origin` 可推、`upstream` 指上游），日常改动都在检出里做。`~/.dsh/theme-tarballs/` 只保留最近 3 个版本的 tarball（更老的会删掉，回滚粒度以这 3 个为准）。每次改动后的循环：

1. 跑上面的非浏览器验证；完整 `npm test` 依赖 Chrome，本机受限环境起不来时以 CI 为准。
2. 先改 `package.json` 的版本号再构建——版本号会编进构建产物。
3. 打包：正常情况下 `npm run pack:local --cache .cache/npm`（`prepack` 会跑完整 `npm run check`）；本机跳过浏览器用例时改用 `npm run build && npm pack --ignore-scripts --cache .cache/npm --pack-destination /tmp/theme-pack`。
4. 把 tarball 放进 `~/.dsh/theme-tarballs/`，按上面的 CLI 命令 add 一次，再完整退出并重开 DSH。
5. 提交并 push 到 `origin main`，等 GitHub Actions 的 `npm run check` 通过。

改动前先备份 profile 的 `cordis.patch.yml` 和 `package.json`：旧配置里可能残留同一 id（`ui-skin-ccd-style`）的条目，会覆盖插件的默认配置。安装完还要把包名加进 profile `package.json` 的 `dsh.profile.bundles` 才会被加载。

## 本机已知事项

- 插件市场（dshmarket）的主题开关对本插件有死锁：关掉时会把 bundle 从 `dsh.profile.bundles` 移除，而重新打开要求热挂载成功、本插件的宿主半边做不到。本机给 `~/.dsh/profiles/desktop/node_modules/dshmarket/lib/themes.js` 打过 `ccd-fork-patch` 补丁，并用幂等脚本 `~/.dsh/theme-tarballs/repair-ccd-theme.sh` 兜底；dshmarket 升级会覆盖补丁，重跑该脚本即可（月检任务也会检查）。主题开关优先用 DSH 设置里的开关，不要用市场里的主题开关。
- 主题设置只出现在 `设置 → Minimal Style`；插件不注册侧栏面板行，所以侧栏与「更多」里没有「主题」入口。
- 本机不跑浏览器用例（Chrome 每次启动都会弹钥匙串授权），浏览器覆盖以 CI 为准。
- 侧栏 pin/隐藏状态由 DSH 持久化；如果以后再加侧栏入口，要先想清楚“取消常驻后重启又回来”的问题。

## 发布

npm 上的 `dsh-claude-desktop-theme` 包名归上游所有，不能直接往上发。决定自行发布前要先把包名改掉，涉及：

- `package.json` 的 `name`、`repository`、`homepage`、`bugs`
- `cordis.patch.yml` 里的 `name`
- `src/shared/identity.ts` 的 `PLUGIN_ID`（改它会让已有配置失效，需要迁移）
- `src/client/compat/plugin-feedback.ts` 的 `FEEDBACK_ISSUE_URL`、`src/client/compat/account-more.ts` 里的 GitHub 链接
- `scripts/check-architecture.mjs` 的 `RAW_PREFIX`，以及 README / install.md 里的包名与链接

改名前直接用本地 tarball 安装即可。
