# RF-Mem 布局与交互样页 · 2026-11-11

独立样页：https://yuxhf.github.io/GroupMT/interaction-preview/

不替换现版报告或已发布首页。按 yux-research-html-deck 的机制动画约定，沿用正式报告 RF-Mem Figure 18 的医疗查询场景、七步解释与英文 Figures 1 / 2；没有新造论文结论。保留原研究报告、skills、工作流和研究记忆。

## 改动

- 原图／任务演示在同一位置切换；图在左、当前步骤解释在右，公式与架构对照默认收起。
- 七个具名步骤可直接跳转；支持重置、前后步、播放暂停和三种速度。终帧立即结束，隐藏标签页、离开演示及打开原图时停止播放。
- 专注演示使用原生 dialog，支持 Esc、焦点限制与退出后焦点返回；原图可在模态层适应窗口／按原尺寸查看。
- 保留任务场景；新状态短暂突出实际变化对象，不用装饰性循环。修正两处分支分数标签重叠，将中间 ResultBag 槽位与最终填充状态区分。
- 键盘：图区／控制区左右键切步，Home / End 到首末步，空格在图区播放；原生按钮保留空格激活。视图页签支持左右与 Home / End。减少动态效果时只用手动切步。
- 小屏保留图的最小可读宽度，图内横向滚动；解释移至下方。保留静态首帧、完整步骤文字、论文链接与示意边界。

## 文件与复核

`build_preview.py` 从已批准报告抽取图与步骤，生成 `index.html` 和 `source-record.json`。`preview.css` 负责排版，`preview.mjs` 负责页面／图像／键盘交互，`player-state.mjs` 管理播放状态；`test-player.mjs` 检查播放的时间与边界行为。正式图像与基础 SVG 样式引用已发布报告的相对路径。

在工作区运行：

```sh
python3 reports/group_meeting_site/interaction-preview/build_preview.py
node reports/group_meeting_site/interaction-preview/test-player.mjs
node --check reports/group_meeting_site/interaction-preview/preview.mjs
```

本地预览需与正式发布资源放在一起：将此文件夹复制为 `reports/group_meeting_site/publish/interaction-preview/`，再运行：

```sh
python3 -m http.server 8781 --bind 127.0.0.1 --directory reports/group_meeting_site/publish
```

浏览 `http://127.0.0.1:8781/interaction-preview/`。原工程 `git_commit: not_available`；公开仓库提交单独记录在发布收据中。

验证包括 Node 播放状态检查、JS 语法、HTML ID／控制目标、相对资源、来源哈希及原发布文件哈希。CUA 连接超时，尚未完成真实浏览器的目视与点按复核；不把源代码／状态检查称为视觉验收。未运行正式实验或训练。Human 待决定：是否将此布局与操作方式推广到其余论文页。
