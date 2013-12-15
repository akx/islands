import os
import lxml.html as lh
import subprocess
tree = lh.parse("isl.html")
files = []
for script in tree.getroot().cssselect("script"):
	files.append(os.path.realpath(os.path.join(".", script.attrib["src"])))

cmd = "uglifyjs -m -c --screw-ie8 -b beautify=false,max-line-len=2048".split(None)
cmd.extend(files)
sp = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=True)
stdout, _ = sp.communicate()
with file("_all.js", "wb") as outf:
	outf.write(stdout)