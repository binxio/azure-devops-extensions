VENDOR=
EXTENSION=

check:
	@echo "Vendor: ${VENDOR}"
	@echo "Extension: ${EXTENSION}"

ifeq ($(VENDOR),)
	$(error Missing required argument: VENDOR)
endif

ifeq ($(EXTENSION),)
	$(error Missing required argument: EXTENSION)
endif

init:
	@npm ci

release: check init
	@npx task release ${VENDOR} ${EXTENSION} ${SOURCE_PATH}