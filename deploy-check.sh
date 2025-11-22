#!/bin/bash

echo "🔍 lemonTrainer Deployment Readiness Check"
echo "==========================================="
echo ""

# Check if git is initialized
if [ -d .git ]; then
    echo "✅ Git repository initialized"
else
    echo "❌ Git repository not initialized"
    echo "   Run: git init"
    exit 1
fi

# Check if remote is set
if git remote -v | grep -q origin; then
    echo "✅ Git remote configured"
    git remote -v | head -1
else
    echo "⚠️  No git remote configured"
    echo "   You'll need to push to GitHub for deployment"
    echo "   Run: git remote add origin <your-repo-url>"
fi

echo ""
echo "📦 Building project..."
npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
    echo "   Build output in: ./dist"
else
    echo "❌ Build failed"
    echo "   Run 'npm run build' to see errors"
    exit 1
fi

echo ""
echo "📋 Deployment Configuration Files:"
if [ -f vercel.json ]; then
    echo "✅ vercel.json (Vercel)"
else
    echo "❌ vercel.json missing"
fi

if [ -f netlify.toml ]; then
    echo "✅ netlify.toml (Netlify)"
else
    echo "❌ netlify.toml missing"
fi

if [ -f .github/workflows/deploy-pages.yml ]; then
    echo "✅ GitHub Actions workflow (GitHub Pages)"
else
    echo "❌ GitHub Actions workflow missing"
fi

if [ -f wrangler.toml ]; then
    echo "✅ wrangler.toml (Cloudflare Pages)"
else
    echo "❌ wrangler.toml missing"
fi

echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Commit your changes:"
echo "   git add ."
echo "   git commit -m 'Ready for deployment'"
echo ""
echo "2. Push to GitHub:"
echo "   git push origin main"
echo ""
echo "3. Choose a deployment platform:"
echo "   - Vercel: https://vercel.com (Easiest - recommended)"
echo "   - Netlify: https://netlify.com"
echo "   - GitHub Pages: Enable in repo settings"
echo "   - Cloudflare: https://pages.cloudflare.com"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions!"
echo ""
