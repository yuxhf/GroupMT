"""Run from repository root after adding a dated report folder and manifest row."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'meetings.json').read_text())
assert len({x['path'] for x in data})==len(data)
for row in data:
    assert (root/row['path']).is_file(),row['path']
data.sort(key=lambda x:(x['date'],x.get('slug','')),reverse=True)
(root/'meetings.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
(root/'meetings.js').write_text('window.MEETINGS='+json.dumps(data,ensure_ascii=False)+';\n')
print(f'Updated date selectors for {len(data)} reports.')
