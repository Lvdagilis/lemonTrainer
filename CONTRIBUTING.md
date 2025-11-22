# Contributing to lemonTrainer

Thank you for your interest in contributing to lemonTrainer! This document provides guidelines and information for contributors.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. We expect:
- Respectful and constructive communication
- Focus on technical merit and project goals
- Patience with newcomers and willingness to help
- Professional conduct in all interactions

### Unacceptable Behavior

- Harassment or discriminatory language
- Personal attacks or trolling
- Publishing others' private information
- Other conduct that would be inappropriate in a professional setting

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Git
- A Chromium-based browser (Chrome, Edge, Opera) for testing Bluetooth features

### Setup Development Environment

1. **Fork and Clone**
   ```bash
   git fork https://github.com/Lvdagilis/lemonTrainer
   cd lemonTrainer
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   Navigate to `https://localhost:5173`

## Development Process

### Branch Strategy

- `main` - Production-ready code
- Feature branches - `feature/your-feature-name`
- Bug fixes - `fix/issue-description`
- Documentation - `docs/what-youre-documenting`

### Workflow

1. **Create a Branch**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make Changes**
   - Write code following our [coding standards](#coding-standards)
   - Test your changes thoroughly
   - Update documentation if needed

3. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Add feature: brief description"
   ```

   **Commit Message Format:**
   ```
   <type>: <subject>

   <body>

   <footer>
   ```

   **Types:**
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

4. **Push and Create PR**
   ```bash
   git push origin feature/my-new-feature
   ```

## Pull Request Process

### Before Submitting

- [ ] Code builds successfully (`npm run build`)
- [ ] Linter passes (`npm run lint`)
- [ ] All functionality works as expected
- [ ] Documentation updated if needed
- [ ] No console.log statements in production code
- [ ] TypeScript errors resolved

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How did you test these changes?

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-reviewed my code
- [ ] Commented complex code sections
- [ ] Updated documentation
- [ ] No new warnings or errors
- [ ] Tested on actual Bluetooth trainer (if applicable)
```

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Provide explicit types for function parameters and return values
- Avoid `any` type - use specific types or `unknown`
- Use type imports (`import type { ... }`)

**Example:**
```typescript
// Good
export function calculatePower(ftp: number, percentage: number): number {
  return Math.round(ftp * (percentage / 100));
}

// Bad
export function calculatePower(ftp, percentage) {
  return ftp * (percentage / 100);
}
```

### React Components

- Use functional components with hooks
- Extract complex logic into custom hooks
- Keep components focused and single-purpose
- Use proper prop types

**Example:**
```typescript
interface Props {
  power: number;
  onChange: (power: number) => void;
}

export function PowerControl({ power, onChange }: Props) {
  // Component logic
}
```

### Code Style

- Use 2 spaces for indentation
- Maximum line length: 100 characters
- Use meaningful variable and function names
- Add JSDoc comments to public APIs

### File Organization

```
src/
├── components/     # Reusable UI components
├── pages/         # Page-level components
├── services/      # Business logic & API wrappers
├── hooks/         # Custom React hooks
├── types/         # TypeScript type definitions
└── *.css          # Component styles
```

## Testing

### Manual Testing Checklist

When testing Bluetooth features:

- [ ] Connect to trainer successfully
- [ ] Receive real-time power/cadence data
- [ ] ERG mode responds to power changes
- [ ] Disconnect/reconnect works properly
- [ ] Heart rate monitor connects (if available)
- [ ] Workout playback functions correctly
- [ ] FIT file exports successfully
- [ ] PWA installation works

### Browser Testing

Test on:
- Chrome (desktop and Android)
- Edge (desktop)
- Opera (desktop)

## Documentation

### When to Update Docs

- Adding new features
- Changing existing behavior
- Adding new dependencies
- Modifying build process
- Security-related changes

### Documentation Files

- `README.md` - Project overview and quick start
- `INSTALL.md` - Detailed installation instructions
- `DEPLOYMENT.md` - Deployment guides
- `CHANGELOG.md` - Version history
- Inline code comments - Complex logic explanation

## Questions or Problems?

- **Bug Reports**: Open an issue with detailed reproduction steps
- **Feature Requests**: Open an issue describing the feature and use case
- **Questions**: Open a discussion or issue

## License

By contributing to lemonTrainer, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to lemonTrainer! 🚴‍♂️
