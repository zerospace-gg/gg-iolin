PKL=$(shell which pkl)

GAME=game/game.pkl

.PHONY: test
.PHONY: clean
.PHONY: all
.PHONY: show

show: 
	"${PKL}" eval "${GAME}" -f json | bat -l json -n --file-name game.json

show-ugly:
	"${PKL}" eval "${GAME}" -f json
