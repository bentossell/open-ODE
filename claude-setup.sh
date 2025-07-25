#!/bin/bash
# Script to pre-configure Claude in Docker container

# This script would run once to set up Claude with:
# - Default text style
# - API key configuration
# - Trust settings

# Create config directory
mkdir -p ~/.config/claude-code

# Create a config file that skips some prompts
cat > ~/.config/claude-code/config.json << EOF
{
  "textStyle": "default",
  "trustWorkspace": true,
  "useApiKey": true,
  "skipSecurityWarning": true
}
EOF

echo "Claude pre-configuration complete"