VERSION=8.4

default: highlight/build
	@cp -f highlight/build/highlight.* .
	@cp -f highlight/src/styles/* styles
	@du -hs highlight.*

highlight/build: highlight
	@cd highlight && git fetch && git checkout $(VERSION)
	@cd highlight && npm install && node tools/build.js

highlight:
	@git clone git://github.com/isagalaev/highlight.js.git $@

clean:
	@rm -rf highlight/build

.PHONY: default
