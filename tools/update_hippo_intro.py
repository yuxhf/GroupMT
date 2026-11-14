"""Rebuild this addition from its editable fragment, preserving the report."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / 'meetings' / '2026-11-08-agent-memory'


def main():
    target = REPORT / 'index.html'
    html = target.read_text(encoding='utf-8')
    fragment = (REPORT / 'sources' / 'hippo_problem_intro.html').read_text(encoding='utf-8').strip()
    start, end = '<!-- hippo-problem-intro:start -->', '<!-- hippo-problem-intro:end -->'
    if start in html:
        if html.count(start) != 1 or html.count(end) != 1:
            raise ValueError('Expected one introduction region')
        html = re.sub(re.escape(start) + r'[\s\S]*?' + re.escape(end), lambda _: fragment, html, count=1)
    else:
        section = html.index('<section class="report-section" id="hippo-focus">')
        anchor = html.index('<div class="rfmem-reader task-reader" data-task-reader="hippo">', section)
        html = html[:anchor] + fragment + '\n' + html[anchor:]
    digest = hashlib.sha256((REPORT / 'assets' / 'hippo-problem-intro.css').read_bytes()).hexdigest()[:12]
    link = f'<link rel="stylesheet" href="assets/hippo-problem-intro.css?v={digest}">'
    if 'href="assets/hippo-problem-intro.css' in html:
        html = re.sub(r'<link rel="stylesheet" href="assets/hippo-problem-intro\.css[^\"]*">', link, html, count=1)
    else:
        html = html.replace('</head>', link + '</head>', 1)
    target.write_text(html, encoding='utf-8', newline='\n')
    sources_path = REPORT / 'report_sources.json'
    sources = json.loads(sources_path.read_text(encoding='utf-8'))
    additions = sources.setdefault('teaching_additions', [])
    additions[:] = [item for item in additions if item.get('id') != 'hippo-problem-intro']
    additions.append({
        'id': 'hippo-problem-intro',
        'section': 'hippo-focus',
        'editable_source': 'sources/hippo_problem_intro.html',
        'origin': 'user_requested_explanatory_diagram',
        'source_url': 'https://arxiv.org/html/2502.14802v2#S3',
        'boundary_note': 'Original fictional Chinese teaching case; evidence topology, not measured retrieval rankings or a PPR trace.',
    })
    sources_path.write_text(json.dumps(sources, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    manifest_path = REPORT / 'source_manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    for name in ['index.html', 'report_sources.json', 'assets/hippo-problem-intro.css', 'sources/hippo_problem_intro.html']:
        entry = next((item for item in manifest['files'] if item['path'] == name), None)
        if entry is None:
            entry = {'path': name, 'role': 'authored_teaching_introduction'}
            manifest['files'].append(entry)
        entry['sha256'] = hashlib.sha256((REPORT / name).read_bytes()).hexdigest()
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    print('Updated HippoRAG introduction; existing animation preserved.')


if __name__ == '__main__':
    main()
