#!/usr/bin/env bash
set -euo pipefail
newman run doctor-chat-priority12.postman_collection.json -e doctor-chat-local.postman_environment.template.json
