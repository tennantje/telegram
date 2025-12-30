#!/bin/bash
set -e

echo "📦 Bumping version and tagging..."
npm version patch

echo "⬆️  Pushing to git..."
git push && git push --tags

echo "🚀 Publishing to npm..."
npm publish

echo "✅ Published!"
