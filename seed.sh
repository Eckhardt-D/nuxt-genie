#!/bin/bash

set -e  # Exit immediately if a command fails
set -o pipefail  # Exit if any command in a pipeline fails

# Define variables
REPO_URL="https://github.com/nuxt/nuxt/archive/refs/heads/main.zip"
ZIP_FILE="nuxt-main.zip"
EXTRACTED_FOLDER="nuxt-main"
TARGET_FOLDER="./nuxt-docs"

# Step 1: Download the Nuxt repository ZIP
echo "Downloading Nuxt repository..."
curl -L -o "$ZIP_FILE" "$REPO_URL"

# Step 2: Unzip the repository
echo "Unzipping repository..."
unzip -q "$ZIP_FILE"

# Step 3: Create target folder if it doesn't exist
mkdir -p "$TARGET_FOLDER"

# Step 4: Copy documentation files
echo "Copying Nuxt docs to $TARGET_FOLDER..."
cp -r "$EXTRACTED_FOLDER/docs/"* "$TARGET_FOLDER/"

# Step 5: Cleanup
echo "Cleaning up..."
rm -rf "$ZIP_FILE" "$EXTRACTED_FOLDER"

echo "✅ Seeding completed. Nuxt docs are in $TARGET_FOLDER."
