#!/usr/bin/env bash
# Deliberately public fixtures. Never source production credentials in CI.
export PASSWORD_HASH=d59d14ed7bc09f4f62fd8270fa31126c01691c7fa666dc81371686d5ed57e449
export SESSION_SECRET=ci-fixture-only-session
export NANO_GPT_API_KEY=ci-fixture-no-upstream
export API_BASE_URL=http://127.0.0.1:9
export ENHANCED_QUALITY_PASSWORD_HASH="$PASSWORD_HASH"
