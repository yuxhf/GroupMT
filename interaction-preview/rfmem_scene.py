"""A task-specific scene keyed to the actual IDs in paper Figure 18."""
from html import escape

def scene(case):
    all_steps = ','.join(str(i) for i in range(8))
    memories = {m['id']:m for m in case['memories']}
    def visible(start):
        return f'data-show="{",".join(str(i) for i in range(start,8))}" hidden aria-hidden="true"'
    def node(id, x, y, ghost=False, note=''):
        m = memories.get(id,case['other'].get(str(id),{}))
        label = m.get('label','候选')
        cls = 'memory-node'+(' discarded' if ghost else '')
        return (f'<g class="{cls}" data-memory-node="{id}" transform="translate({x} {y})">'
                f'<circle r="27"/><text class="memory-id" y="-5">{id}</text>'
                f'<text class="node-label" y="12">{escape(label)}</text>'
                +(f'<text class="node-note" y="44">{escape(note)}</text>' if note else '')+'</g>')
    def path(d, ghost=False):
        return f'<path class="branch-edge{" discarded" if ghost else ""}" d="{d}"/>'
    out = ['<svg class="rf18-map rf-scene" viewBox="0 0 880 470" role="img" aria-labelledby="scene-title scene-desc">',
           '<title id="scene-title">Figure 18：从四轮分支选出完整十条记忆</title>',
           '<desc id="scene-desc">记忆 ID 与论文原图对应。右侧累计结果从四条到六条、九条、十条；虚线表示未保留的分支。</desc>',
           '<defs><marker id="case-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#8496aa"/></marker></defs>',
           '<g class="rf18-route"><circle class="query-node" cx="43" cy="238" r="32"/><text x="43" y="232" class="query-label">循证</text><text x="43" y="250" class="query-label">医疗建议</text></g>']
    for x,round,start in [(178,0,2),(326,1,4),(466,2,5),(597,3,6)]:
        out.append(f'<g class="round-header" {visible(start)}><text x="{x}" y="25">r={round}</text><text x="{x}" y="44" class="budget-label">N={case["rounds"][round]["budget"]}</text></g>')
    out.append(f'<g class="rf18-r0" {visible(2)}>')
    out += [path('M75 224 Q90 165 111 153'),path('M75 253 Q90 314 111 324'),
            '<ellipse class="cluster-outline" cx="178" cy="153" rx="66" ry="47"/><ellipse class="cluster-outline secondary" cx="178" cy="324" rx="66" ry="47"/>',
            '<text x="178" y="92" class="cluster-label">Cluster 1</text><text x="178" y="263" class="cluster-label">Cluster 2</text>']
    for id in [47,7,70,36]:
        m=memories[id];out.append(node(id,m['x'],m['y']))
    out.append('</g>')
    out.append(f'<g class="rf18-centroids" {visible(3)}><text class="query-direction" x="273" y="126">q₁ →</text><text class="query-direction" x="273" y="297">q₂ →</text></g>')
    out.append(f'<g class="rf18-r1" {visible(4)}>')
    out += [path('M244 153 L294 153'),path('M244 171 Q270 235 294 236',True),path('M244 324 L294 324'),path('M244 340 Q270 405 294 405',True),node(69,326,153),node(9,326,324),node(9,326,236,True,'同 ID 不重复计数'),node(6,326,405,True,'未保留')]
    out.append('</g>')
    out.append(f'<g class="rf18-r2" {visible(5)}>')
    out += [path('M353 146 Q392 121 424 121'),path('M349 172 Q385 260 405 267'),path('M349 342 Q377 405 393 405',True),path('M349 342 Q426 405 465 405',True),'<ellipse class="cluster-outline" cx="464" cy="279" rx="60" ry="74"/>',node(4,457,121),node(44,435,252),node(45,493,305),node(3,410,405,True),node(6,493,405,True)]
    out.append('</g>')
    out.append(f'<g class="rf18-r3" {visible(6)}>')
    out += [path('M484 121 L565 121'),path('M479 135 Q545 213 565 214',True),path('M479 139 Q553 350 565 350',True),node(41,597,121),node(48,597,214,True,'已满 10 条，不纳入'),node(1,597,350,True,'未保留')]
    out.append('</g>')
    out.append('<g class="rf18-bag"><rect class="result-background" x="662" y="60" width="206" height="361" rx="8"/><text x="678" y="83" class="bag-heading" data-bag-title>ResultBag</text><text x="850" y="83" class="bag-count" data-bag-count>0 / 10</text>')
    for i in range(10):
        y=111+i*29
        out.append(f'<g class="result-row" data-result-slot="{i}"><rect x="674" y="{y-15}" width="182" height="26" rx="4"/><text x="684" y="{y+2}" class="slot-number">{i+1:02}</text><text x="708" y="{y+2}" class="slot-label" data-result-label="{i}">待补充</text><text x="846" y="{y+2}" class="slot-round" data-result-round="{i}"></text></g>')
    out.append('<text x="765" y="443" class="result-caption" data-bag-caption>同一 ID 只计一次</text></g>')
    for i,m in enumerate(case['memories']):
        # Tokens are motion cues for each concrete selected ID, never invented scores.
        out.append(f'<g class="transfer-token" data-transfer-id="{m["id"]}" data-from-x="{m["x"]}" data-from-y="{m["y"]}" data-to-x="696" data-to-y="{111+i*29}" hidden aria-hidden="true"><circle r="12"/><text y="4">{m["id"]}</text></g>')
    out.append('</svg>')
    return ''.join(out)
