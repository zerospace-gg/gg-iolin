PKL=$(shell which pkl)

ALL_PKL=**/*.pkl
GAME=game/game.pkl
DIST=dist
BUILD=build
VERSION=0.0.1
VERSION_TEXT=${DIST}/version.txt
JSON_PLAIN=${DIST}/zsdata.json
JSON_MIN=${DIST}/zsdata.min.json
JSON_GZ=${DIST}/zsdata.gz
JSON_ZIP=${DIST}/zsdata.zip
JSON_PRE=${BUILD}/zsdata.json
JSON_MANIFEST=${DIST}/zsdata.manifest.json
TARGETS=${JSON_PLAIN} ${JSON_MIN} ${JSON_GZ} ${JSON_ZIP}
SHOW=$(shell which bat || which cat)

.PHONY: test
.PHONY: clean
.PHONY: all
.PHONY: show
.PHONY: force

all: ${TARGETS}
	@echo "All done"
	@ls -lh ${DIST}

force: clean all

${BUILD}:
	@mkdir -p ${BUILD}

${DIST}:
	@mkdir -p ${DIST}
	
${JSON_PRE}: ${ALL_PKL} ${BUILD}
	@echo "Building ${JSON_PRE}"
	@mkdir -p ${DIST}
	@"${PKL}" eval "${GAME}" -f json > ${JSON_PRE}

${JSON_PLAIN}: ${JSON_PRE} ${DIST}
	@echo "Building ${JSON_PLAIN}"
	@node bin/add-release-meta.mjs ${VERSION} ${JSON_PRE} ${JSON_PLAIN} ${JSON_MANIFEST} ${VERSION_TEXT}

${JSON_MIN}: ${JSON_PLAIN}
	@echo "Building ${JSON_MIN}"
	@node -e "const x = require('./dist/zsdata.json'); require('fs').writeFileSync('${JSON_MIN}', JSON.stringify(x), 'utf8');"

${JSON_GZ}: ${JSON_MIN}
	@echo "Building ${JSON_GZ}"
	@gzip -9 < ${JSON_MIN} > ${JSON_GZ}

${JSON_ZIP}: ${JSON_PLAIN}
	@echo "Building ${JSON_ZIP}"
	@cd ${DIST}
	@zip -r ${JSON_ZIP} ${JSON_PLAIN}

show: ${JSON_PLAIN}
	@echo "current ${JSON_PLAIN}
	$(SHOW) ${JSON_PLAIN}

clean:
	rm -f ${TARGETS}
	rm -rf ${DIST}
	rm -rf ${BUILD}
