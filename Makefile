DIST=dist

.PHONY: test
.PHONY: clean
.PHONY: all
.PHONY: force

all: ${DIST}
	bash buildall.sh

${DIST}:
	@echo "Creating ${DIST}"
	mkdir -p ${DIST}

clean:
	rm -rf ${DIST}
