import os, time

root = r"c:\Users\ASUS\Desktop\Raghav\Rag\frontend"
skip = "node_modules"
exts = (".png", ".jpg", ".jpeg", ".webp")
results = []
for dirpath, dirnames, filenames in os.walk(root):
    if skip in dirpath:
        continue
    for f in filenames:
        if f.lower().endswith(exts):
            fp = os.path.join(dirpath, f)
            results.append((fp, os.path.getsize(fp), os.path.getmtime(fp)))
results.sort(key=lambda x: x[2], reverse=True)
for fp, sz, mt in results[:20]:
    print(f"{sz:>10}  {time.ctime(mt)}  {fp}")
