import os

file_path = 'src/app/dashboard/page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Unified function to update content safely with \n or \r\n
def safe_replace(text, old, new):
    if old in text:
        return text.replace(old, new)
    # Try with \r\n
    old_rn = old.replace('\n', '\r\n')
    if old_rn in text:
        return text.replace(old_rn, new.replace('\n', '\r\n'))
    return text

# 1. Update folder spacings
# Indentations vary, so we'll be surgical.
# These patterns are from view_file lines 1036 and 1124
content = safe_replace(content, '               <div className="space-y-3">', '               <div className="space-y-8">')
content = safe_replace(content, '              <div className="space-y-3">', '              <div className="space-y-8">')

# 2. Update Alert Box inner content
old_alert_inner = """              <div className="flex items-center gap-3 relative z-10 px-3 py-3">
                <div className="p-2 bg-amber-500/20 rounded-xl text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  <Zap size={20} className="animate-pulse" />
                </div>
                <p className="text-sm text-zinc-300">
                  <strong className="text-amber-500 font-bold">{totalDue}</strong> {totalDue === 1 ? 'carta precisa ser revisada' : 'cartas precisam ser revisadas'} hoje!
                </p>
              </div>"""

new_alert_inner = """              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                  <Zap size={24} className="animate-pulse" />
                </div>
                <div>
                  <p className="text-base text-zinc-200">
                    <strong className="text-amber-500 font-bold">{totalDue}</strong> {totalDue === 1 ? 'carta precisa ser revisada' : 'cartas precisam ser revisadas'} hoje!
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">Mantenha seu streak ativo estudando agora.</p>
                </div>
              </div>"""

content = safe_replace(content, old_alert_inner, new_alert_inner)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("UI Refinement Complete.")
