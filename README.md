# GroupMT · GitHub Pages

报告网站源码目标：`https://github.com/yuxhf/GroupMT`（public）。

发布设置：Settings → Pages → Build and deployment → Source 选择 **Deploy from a branch**，Branch 选择 **main**，目录 **/ (root)**，Save。仓库根目录已提供 index.html 与 .nojekyll，无需 Node 构建、服务器或密钥。

启用后默认站点地址为 `https://yuxhf.github.io/GroupMT/`；需要等 GitHub 实际发布成功再当作可用网址。之后 main 分支提交会更新站点。

Home 暂为站内 `home.html` 简洁入口；当前尚无 `yuxhf.github.io` 根站仓库。以后建立根站可直接使用这个入口风格并链接本报告站，不影响报告地址。

新增组会：复制独立报告目录到 meetings/日期-主题/，在 meetings.json 添加 date、slug、title、description、updated、path，运行 `python3 tools/update_index.py`，再提交。每份新增报告需保留其相对资源路径；顶部导航引用根目录的 archive.css、meetings.js、archive.js。

本地工作区完整构建器位于 scripts/build_site.py，原研究报告仍是内容来源。网站只上传 dist 中直接展示所需的文件和维护脚本，不上传原 PPT、原研究目录或凭据。日期暂沿用报告自身的 2026-11-08；更新日期为 2026-11-11。

HippoRAG 动画前的问题导读保存在 `meetings/2026-11-08-agent-memory/sources/hippo_problem_intro.html`；修改后运行 `python tools/update_hippo_intro.py`，更新页面、样式缓存标记与来源清单。若重新导出完整报告，请在导出后再运行此命令保留该导读。

样式借鉴 https://jialuncao.github.io/ 的侧栏、字体层级和列表组织，页面代码为此站编写，未复制其个人内容。未运行正式实验或训练。
