PKL=$(shell which pkl)

ALL_PKL=**/*.pkl
GAME=game/game.pkl
DIST=dist/
JSON_PLAIN=${DIST}/zsdata.json
JSON_MIN=${DIST}/zsdata.min.json
JSON_GZ=${DIST}/zsdata.gz
JSON_ZIP=${DIST}/zsdata.zip
TARGETS=${JSON_PLAIN} ${JSON_MIN} ${JSON_GZ}
SHOW=$(shell which bat || which cat)

.PHONY: test
.PHONY: clean
.PHONY: all
.PHONY: show

clean:
	rm -f ${TARGETS}
	rm -rf ${DIST}

${JSON_PLAIN}: ${ALL_PKL}
	mkdir -p ${DIST}
	"${PKL}" eval "${GAME}" -f json > ${JSON_PLAIN}

${JSON_MIN}: ${JSON_PLAIN}
	node -e "const x = require('./dist/zsdata.json'); console.log(JSON.stringify(x))" > ${JSON_MIN}

${JSON_GZ}: ${JSON_MIN}
	gzip -9 < ${JSON_MIN} > ${JSON_GZ}

all: ${TARGETS}

show: ${JSON_PLAIN}
	$(SHOW) ${JSON_PLAIN}

