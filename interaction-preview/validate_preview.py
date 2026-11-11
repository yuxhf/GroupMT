"""Validate and stage the interaction pilot beside its published dependencies."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib
import json
import re
import shutil
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
PUBLISH = ROOT / 'publish'

class Audit(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.refs, self.targets = [], [], []
    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        for key in ('href', 'src'):
            if key in attrs:
                self.refs.append(attrs[key])
        for key in ('aria-controls', 'aria-labelledby'):
            self.targets.extend(attrs.get(key, '').split())

audit = Audit()
audit.feed((HERE/'index.html').read_text())
case = json.loads((HERE/'rfmem-case.json').read_text())
expected = [47,7,70,36,69,9,4,44,45,41]
assert [m['id'] for m in case['memories']] == expected, 'Figure 18 final ID mismatch'
assert len(set(expected)) == case['parameters']['K'] == 10
cumulative = []
for round in case['rounds']:
    cumulative.extend(round['added'])
    assert len(cumulative) == len(set(cumulative)) == round['total']
assert [r['total'] for r in case['rounds']] == [4,6,9,10]
assert cumulative == expected
assert case['steps'][-1]['bag'] == expected
assert case['steps'][1]['bag'] == case['fast']
assert all(len(s['bag']) == len(set(s['bag'])) <= 10 for s in case['steps'])
assert all(set(s['added']).issubset(s['bag']) for s in case['steps'])
assert not any(id in expected for id in (48,1,3,6,2,80)), 'Pruned/noise IDs entered slow final bag'
assert all(len(m['label']) <= 4 for m in case['memories']), 'SVG memory label too long'
assert len(audit.ids) == len(set(audit.ids)), 'Duplicate HTML IDs'
assert all(target in audit.ids for target in audit.targets), 'Missing ARIA target'
if (ROOT/'design-preview').is_dir() and not (PUBLISH/'design-preview').exists():
    shutil.copytree(ROOT/'design-preview', PUBLISH/'design-preview')
before = {str(path.relative_to(PUBLISH)):hashlib.sha256(path.read_bytes()).hexdigest()
          for path in PUBLISH.rglob('*') if path.is_file() and 'interaction-preview' not in path.parts}
shutil.copytree(HERE, PUBLISH/'interaction-preview', dirs_exist_ok=True, ignore=shutil.ignore_patterns('__pycache__'))
for ref in audit.refs:
    if re.match(r'^(https?:|#|mailto:)', ref):
        continue
    target = PUBLISH/'interaction-preview'/ref.split('#')[0]
    if target.is_dir():
        target /= 'index.html'
    assert target.is_file(), ref
for filename, digest in before.items():
    assert hashlib.sha256((PUBLISH/filename).read_bytes()).hexdigest() == digest, filename
for filename in ('preview.mjs', 'player-state.mjs'):
    subprocess.run(['node', '--check', str(HERE/filename)], check=True)
subprocess.run(['node', str(HERE/'test-player.mjs')], check=True)
plan = []
for path in sorted(HERE.iterdir()):
    if not path.is_file():
        continue
    content = path.read_bytes()
    plan.append({'path':'interaction-preview/'+path.name, 'bytes':len(content),
                 'sha256':hashlib.sha256(content).hexdigest(),
                 'git_blob_sha':hashlib.sha1(b'blob '+str(len(content)).encode()+b'\0'+content).hexdigest()})
(ROOT/'interaction_preview_plan.json').write_text(json.dumps(plan, indent=2)+'\n')
validation = {'date':'2026-11-11', 'unique_ids':len(audit.ids), 'all_aria_targets_valid':True,
              'relative_resource_links_valid':True, 'formal_published_files_unchanged':len(before),
              'step_count':len(case['steps']), 'original_english_figures':3, 'final_ids':expected,
              'round_totals':[4,6,9,10], 'case_consistency_checks':'passed', 'node_playback_checks':'passed',
              'node_syntax_checks':'passed', 'browser_visual_qa':'Chrome desktop final Top-10 and r=0 observed; final HTML prose overflow empty and page width equals viewport. CUA interrupted before focus/narrow-screen checks.',
              'formal_experiment_ran':False}
(ROOT/'interaction_preview_validation.json').write_text(json.dumps(validation,indent=2)+'\n')
print(json.dumps({'files':len(plan), 'bytes':sum(item['bytes'] for item in plan), **validation}))
