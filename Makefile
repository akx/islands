.PHONY: clean

islc.html: isl.js
	cat lib/underscore.js lib/clipper.js lib/dat.gui.js lib/svg.js lib/svg.filter.js isl.js | uglifyjs -m -c --screw-ie8 -b beautify=false,max-line-len=2048 | python wraphtml.py > islc.html

clean:
	del all.js islc.html