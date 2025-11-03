SPEC_DIR := openapi
SPEC_FILE := receipts-api.yaml
PORT := 4010
CONTAINER := prism-mock
RAW_URL := https://raw.githubusercontent.com/heziyi0106/api-first-test/main/$(SPEC_DIR)/$(SPEC_FILE)
BUNDLE_FILE := $(SPEC_DIR)/receipts-api.bundle.yaml

.PHONY: mock mock-detached mock-ephemeral mock-raw bundle mock-bundle logs stop-mock remove-mock lint validate

# Foreground: shows logs in terminal, --rm auto-remove after stop
mock:
	@echo "Starting Prism (foreground) using $(SPEC_DIR)/$(SPEC_FILE) ..."
	docker run --rm -p $(PORT):$(PORT) -v "$(PWD)/$(SPEC_DIR)":/tmp/openapi stoplight/prism:4 mock -h 0.0.0.0 /tmp/openapi/$(SPEC_FILE)

# Detached: background, container kept for later stop/logs
mock-detached:
	@echo "Starting Prism (detached) as container '$(CONTAINER)'..."
	docker run -d --name $(CONTAINER) -p $(PORT):$(PORT) -v "$(PWD)/$(SPEC_DIR)":/tmp/openapi stoplight/prism:4 mock -h 0.0.0.0 /tmp/openapi/$(SPEC_FILE)
	@docker ps --filter "name=$(CONTAINER)" --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"

# Detached + --rm (auto remove on stop)
mock-ephemeral:
	@echo "Starting Prism (detached + ephemeral) as container '$(CONTAINER)'..."
	docker run -d --rm --name $(CONTAINER) -p $(PORT):$(PORT) -v "$(PWD)/$(SPEC_DIR)":/tmp/openapi stoplight/prism:4 mock -h 0.0.0.0 /tmp/openapi/$(SPEC_FILE)

# Start Prism from remote raw URL (no host volume mount)
mock-raw:
	@echo "Starting Prism from remote raw URL (no local mount) ..."
	docker run --rm -p $(PORT):$(PORT) stoplight/prism:4 mock -h 0.0.0.0 $(RAW_URL)

# Bundle multi-file spec into a single YAML (requires swagger-cli)
bundle:
	@echo "Bundling $(SPEC_DIR)/$(SPEC_FILE) -> $(BUNDLE_FILE) ..."
	@npx --yes @apidevtools/swagger-cli@4 bundle "$(SPEC_DIR)/$(SPEC_FILE)" -o "$(BUNDLE_FILE)" --type yaml

# Run mock using the bundled single-file spec
mock-bundle: bundle
	@echo "Starting Prism (foreground) using bundled spec $(BUNDLE_FILE) ..."
	docker run --rm -p $(PORT):$(PORT) -v "$(PWD)/$(BUNDLE_FILE)":/tmp/api.yaml stoplight/prism:4 mock -h 0.0.0.0 /tmp/api.yaml

# Follow logs of detached container
logs:
	@docker logs -f $(CONTAINER)

# Stop container (no error if not exist)
stop-mock:
	-@docker stop $(CONTAINER) || true

# Remove container (no error if not exist)
remove-mock:
	-@docker rm $(CONTAINER) || true

# Spectral lint (use npx so no global install required)
lint:
	@echo "Running Spectral lint on $(SPEC_DIR)/$(SPEC_FILE) ..."
	@npx --yes @stoplight/spectral-cli@latest lint "$(SPEC_DIR)/$(SPEC_FILE)" --verbose

# OpenAPI structural validation
validate:
	@echo "Validating OpenAPI spec $(SPEC_DIR)/$(SPEC_FILE) ..."
	@npx --yes swagger-cli@4 validate "$(SPEC_DIR)/$(SPEC_FILE)"