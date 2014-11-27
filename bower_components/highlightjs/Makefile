VERSION=8.3

default: highlight
		@cp -f highlight/build/highlight.* .
		@cp -f highlight/src/styles/* styles
		@du -hs highlight.*

highlight:
		@git clone git://github.com/isagalaev/highlight.js.git $@
		@cd highlight && git pull && git checkout $(VERSION)
		@npm install
		@node tools/build.js
		@cd ..

.PHONY: default
