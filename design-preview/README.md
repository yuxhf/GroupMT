# 2026-11-11 蓝白风格候选预览

独立演示，不修改线上站点或原报告。A 学术侧栏以 Jialun Cao 主页为方向；B 参考 Minimal Light 的轻量档案排版；C 借鉴 VitePress 的文档导航与阅读宽度。用同样内容切换首页／报告正文，以便比较。样式由此项目编写，不复制个人资料，不安装或修改用户 skills。

研究来源：
- https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md
- https://github.com/pbakaus/impeccable （distill / typeset / quieter / critique）
- https://github.com/vercel-labs/agent-skills/blob/main/skills/web-design-guidelines/SKILL.md
- https://github.com/jialuncao/jialuncao.github.io
- https://github.com/yaoyao-liu/minimal-light
- https://github.com/vuejs/vitepress
- https://github.com/jgthms/web-design-in-4-minutes

可取原则：蓝白基调、清晰字体层级、合理阅读行长、结构元素有语义、无顺序的内容不编号、减少重复容器、保持键盘焦点、减少动态效果。外部 skill 只作参考，不替代用户约束或工作区指令。

运行：`python3 -m http.server 8780 --bind 127.0.0.1 --directory reports/group_meeting_site/design-preview`（在研究工作区运行）。

新增 index.html、preview.css、preview.js、本说明及原报告 RPMem 图的只读复制。未运行正式实验，未改正式网站／原报告／研究记忆。待 Human 选择样式或组合后再应用。
