"""Compare both standalone scripts against Node using a real QuickJS engine."""
import json
from pathlib import Path
import subprocess
import quickjs

ROOT = Path(__file__).resolve().parent.parent
cases = json.loads(subprocess.check_output(["node", "tests/engine-cases.js"], cwd=ROOT))
for case in cases:
    context = quickjs.Context()
    context.set_memory_limit(64 * 1024 * 1024)
    context.set_time_limit(5)
    context.eval("var console = {error: function () {}};")
    # Bettbox intentionally supports hosts without this method; preserve that contract.
    if case["script"].startswith("Bettbox"):
        context.eval("Object.fromEntries = undefined;")
    context.eval((ROOT / case["script"]).read_text())
    if case.get("options"):
        context.eval("Object.assign(ruleOptionsEnable, " + json.dumps(case["options"]["toggles"]) + ");")
    actual = json.loads(context.eval("JSON.stringify(main(" + json.dumps(case["input"]) + "))"))
    assert actual == case["expected"], f'{case["script"]}: {case["label"]} differs from Node'
print(f"QuickJS: {len(cases)} cases passed (both scripts, DNS modes, all Bettbox toggles)")
