"""Build an isolated RF-Mem interaction pilot from the approved report."""
import hashlib
import html
import json
from pathlib import Path
import re
from rfmem_scene import scene

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent.parent / '2026-10-25_agent_memory_seminar/index.html'
if not SOURCE.exists():
    SOURCE = HERE.parent / 'meetings/2026-11-08-agent-memory/index.html'
source = SOURCE.read_text()
case = json.loads((HERE/'rfmem-case.json').read_text())
spec = {'steps':case['steps'],'memories':case['memories'],'other':case['other']}
svg = scene(case)
labels = [step['label'] for step in case['steps']]
steps = spec['steps']
buttons = ''.join(f'<button type="button" data-jump="{i}" aria-label="第 {i+1} 步：{label}"'+(' aria-current="step"' if i == 0 else '')+f'>{label}</button>' for i, label in enumerate(labels))
transcript = ''.join(f'<li><strong>{html.escape(s["title"])}</strong><p>{html.escape(s["description"])}</p><p>{html.escape(s["takeaway"])}</p><code>{html.escape(s["formula"])}</code></li>' for s in steps)
ASSETS = '../meetings/2026-11-08-agent-memory/'
paper = '2026 · ICLR · Evoking User Memory: Personalizing LLM via Recollection-Familiarity Adaptive Retrieval'
template = '''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>RF-Mem · 讲解交互样页</title>
<link rel="stylesheet" href="__ASSETS__assets/report-theme.css"><link rel="stylesheet" href="preview.css"><script type="module" src="preview.mjs"></script></head><body>
<header class="site-bar"><a class="brand" href="../">Yux · Reports</a><nav aria-label="预览导航"><a href="../design-preview/">风格候选</a><a href="__ASSETS__#rfmem-focus">对照现版 ↗</a></nav></header>
<main class="page"><header class="page-heading"><div><p class="eyebrow">AGENT MEMORY / RF-MEM</p><h1>一次检索不够时，怎样逐步回忆？</h1><p class="subtitle">沿同一条医疗建议查询，观察局部候选、分支 Query 与最终上下文。</p></div><button type="button" class="quiet-button js-only" data-focus-open>专注演示 ↗</button></header>
<noscript><p class="no-js">当前显示静态首帧；完整步骤与十条结果清单在页末。启用 JavaScript 后可操作动画。</p></noscript>
<div id="workbench" class="workbench" tabindex="0" aria-label="RF-Mem 论文与任务演示">
<div class="workspace-top"><div class="view-tabs js-only" role="tablist" aria-label="讲解视图"><button type="button" role="tab" id="tab-demo" aria-controls="panel-demo" aria-selected="true" tabindex="0" data-view="demo">任务演示</button><button type="button" role="tab" id="tab-overview" aria-controls="panel-overview" aria-selected="false" tabindex="-1" data-view="overview">论文 Overview</button></div><span class="view-meta" data-view-meta>Figure 18 · 教学重构</span><button type="button" class="quiet-button" data-focus-close hidden>退出 · Esc</button></div>
<div class="workspace-body"><div class="canvas-column">
<div id="panel-demo" role="tabpanel" aria-labelledby="tab-demo" tabindex="0"><p class="task-query">查询：探索适合医疗决策的新循证实践。<span>B=2 · F=2 · K=10</span></p><div class="diagram-frame"><div class="diagram step-stage" data-step="0">__SVG__</div></div><p class="diagram-note"><span><i class="memory"></i>真实记忆 ID</span><span><i class="branch"></i>实线：保留方向</span><span>虚线：未保留／未纳入</span><span>N 为检索预算，不是新增条数</span></p></div>
<div id="panel-overview" class="reference-panel" role="tabpanel" aria-labelledby="tab-overview" tabindex="0" hidden><div class="figure-choice" aria-label="选择原图"><button type="button" data-figure="2" aria-pressed="true">Figure 2 · 双路径架构</button><button type="button" data-figure="1" aria-pressed="false">Figure 1 · 动机对比</button><button type="button" data-figure="18" aria-pressed="false">Figure 18 · 完整案例</button></div><figure class="reference-figure"><button type="button" data-image-open aria-label="放大当前论文原图"><img data-reference-image src="__ASSETS__figures/papers/rfmem_architecture.png" width="1115" height="650" alt="RF-Mem Figure 2：Familiarity 与 Recollection 双路径总体架构"></button><figcaption><a href="https://arxiv.org/html/2603.09250v1">__PAPER__</a><span data-figure-caption> · Figure 2 · v1 · 英文原图</span></figcaption></figure></div></div>
<aside class="step-copy" aria-live="polite" aria-atomic="true"><span class="step-position" data-counter>1 / __COUNT__ · 选择路径</span><h2 data-title>__TITLE__</h2><p data-description>__DESC__</p><p class="takeaway" data-takeaway>__TAKEAWAY__</p><details><summary>公式与参数</summary><code data-formula>__FORMULA__</code></details><details class="comparison" data-comparison><summary>对照 Figure 18 原图</summary><img src="__ASSETS__figures/papers/rfmem_personamem_case_figure18.png" width="1390" height="1430" alt="RF-Mem Figure 18 英文原图：四轮分支与完整十条结果" data-thumbnail tabindex="0" role="button" aria-label="放大 Figure 18 原图"></details><details class="memory-list"><summary>当前结果的完整含义（<span data-result-count>0</span> 条）</summary><ol data-result-list><li>尚未检索。</li></ol></details></aside></div>
<div class="control-zone js-only"><div class="transport"><button type="button" data-reset title="回到首步（Home）">重置</button><button type="button" data-prev disabled aria-label="上一步">← 上一步</button><button type="button" data-play class="primary" aria-pressed="false">播放</button><button type="button" data-next aria-label="下一步">下一步 →</button><span class="playback-status" data-status role="status">手动讲解</span><label>节奏<select data-speed aria-label="每步停留时间"><option value="2800">2.8 秒 / 步</option><option value="4500" selected>4.5 秒 / 步</option><option value="7000">7 秒 / 步</option></select></label><span class="keyboard-note">← → 切步 · 空格播放</span></div><nav class="step-list" aria-label="按机制选择步骤">__BUTTONS__</nav></div></div>
<footer class="page-footer"><p>依据 Figure 18 的 ID、实色／虚线分支与 K=10 停止标注重构。中文为内容概括；同轮按原图版面顺序展示，不代表相似度排名。未虚构分支分数。<a href="https://arxiv.org/html/2603.09250v1#A4.SS7.SSS1">论文原文 ↗</a></p><a href="__ASSETS__#rfmem-case">查看 Figure 18 / 19 原图 ↗</a></footer>
<details class="static-transcript"><summary>完整步骤与十条结果文字</summary><ol>__TRANSCRIPT__</ol><h2>最终十条记忆</h2><ol>__RESULTS__</ol></details></main>
<dialog class="focus-dialog" data-focus-dialog aria-label="RF-Mem 专注演示"></dialog>
<dialog class="image-dialog" data-image-dialog aria-label="论文原图放大"><header><strong data-image-title>RF-Mem · Figure 2</strong><div><button type="button" data-image-zoom aria-pressed="false">原尺寸</button><button type="button" data-image-close>关闭 · Esc</button></div></header><div class="image-scroll"><img data-large-image alt=""></div></dialog>
<script type="application/json" id="step-spec">__SPEC__</script></body></html>'''
first = steps[0]
results = ''.join(f'<li><strong>ID {m["id"]} · {m["label"]}</strong>（r={m["round"]}）：{m["meaning"]}</li>' for m in case['memories'])
values = {'ASSETS':ASSETS,'SVG':svg,'PAPER':paper,'TITLE':html.escape(first['title']),'DESC':html.escape(first['description']),'TAKEAWAY':html.escape(first['takeaway']),'FORMULA':html.escape(first['formula']),'BUTTONS':buttons,'TRANSCRIPT':transcript,'SPEC':json.dumps(spec,ensure_ascii=False),'COUNT':str(len(steps)),'RESULTS':results}
for key,value in values.items():
    template = template.replace('__'+key+'__',value)
(HERE/'index.html').write_text(template)
(HERE/'source-record.json').write_text(json.dumps({'source_report':'2026-10-25_agent_memory_seminar/index.html','source_sha256':hashlib.sha256(source.encode()).hexdigest(),'git_commit':'not_available','generated':'2026-11-11','steps':len(steps),'scene':'RF-Mem Figure 18: real IDs, round-wise selection, pruning and K=10 stop; no invented scores.','case_data':'rfmem-case.json','case_data_sha256':hashlib.sha256((HERE/'rfmem-case.json').read_bytes()).hexdigest(),'final_ids':[m['id'] for m in case['memories']],'round_totals':[r['total'] for r in case['rounds']],'boundary':case['boundary'],'formal_report_modified':False,'formal_experiment_ran':False},ensure_ascii=False,indent=2)+'\n')
print(f'Built isolated RF-Mem pilot; {len(steps)} task steps, 10 actual memory IDs, 3 English original figures.')
