.PHONY: clean

islc.html:
	cat lib/*.js isl.js | uglifyjs -m -c --screw-ie8 -b beautify=false,max-line-len=2048 | python wraphtml.py > islc.html

clean:
	del all.js islc.html