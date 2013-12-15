.PHONY: clean

islc.html: _all.js 
	cat _all.js | python wraphtml.py > islc.html

_all.js: isl.js isl-three.js
	python genall.py


clean:
	del _all.js islc.html