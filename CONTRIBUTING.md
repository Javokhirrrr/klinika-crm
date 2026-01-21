# Contributing to Klinika CRM

Thank you for considering contributing to Klinika CRM! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)

---

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Respect differing viewpoints and experiences

---

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/klinika-crm.git
cd klinika-crm
```

### 2. Install Dependencies

```bash
# Backend
npm install

# Frontend
cd klinika-crm-frontend
npm install
cd ..
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

---

## 💻 Development Workflow

### 1. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Update documentation if needed

### 2. Test Your Changes

```bash
# Run tests
npm test

# Check code quality
npm run lint
npm run format:check

# Run specific tests
npm run test:unit
npm run test:integration
```

### 3. Commit Your Changes

```bash
git add .
git commit -m "feat: add amazing feature"
```

---

## 📏 Coding Standards

### JavaScript/Node.js

- Use ES6+ features (const, let, arrow functions, async/await)
- Follow ESLint configuration
- Use Prettier for formatting
- Prefer functional programming patterns
- Keep functions small and focused

### Example:

```javascript
// ✅ Good
const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');
  return user;
};

// ❌ Bad
function getUserById(id) {
  return User.findById(id).then(user => {
    if (!user) {
      throw new Error('User not found');
    } else {
      return user;
    }
  });
}
```

### File Naming

- Use camelCase for files: `userController.js`
- Use PascalCase for models: `User.js`
- Use kebab-case for CSS: `main-layout.css`

### Code Organization

- One component/controller per file
- Group related functions together
- Export at the bottom of the file
- Import dependencies at the top

---

## 🧪 Testing Guidelines

### Writing Tests

- Write tests for all new features
- Maintain minimum 80% code coverage
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Test Structure

```javascript
describe('Feature Name', () => {
  describe('functionName', () => {
    it('should do something specific', async () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = await functionName(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Test Coverage

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

---

## 📝 Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(auth): add password reset functionality

fix(patients): resolve duplicate phone number issue

docs(readme): update installation instructions

test(auth): add unit tests for login controller
```

---

## 🔄 Pull Request Process

### 1. Before Submitting

- [ ] All tests pass (`npm test`)
- [ ] Code is linted (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with main

### 2. PR Title

Use conventional commit format:

```
feat(module): brief description of changes
```

### 3. PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

### 4. Review Process

- Wait for code review from maintainers
- Address feedback and comments
- Make requested changes
- Re-request review after changes

### 5. After Approval

- Maintainers will merge your PR
- Delete your feature branch
- Pull latest changes from main

---

## 🐛 Reporting Bugs

### Before Reporting

- Check existing issues
- Verify it's reproducible
- Gather relevant information

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment:**
- OS: [e.g., Windows 11]
- Node version: [e.g., 18.17.0]
- MongoDB version: [e.g., 6.0]
```

---

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Description of the problem

**Describe the solution you'd like**
Clear description of desired feature

**Describe alternatives you've considered**
Alternative solutions

**Additional context**
Any other context or screenshots
```

---

## 📚 Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [React Documentation](https://react.dev/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

---

## ❓ Questions?

If you have questions, please:

1. Check the documentation
2. Search existing issues
3. Open a new discussion
4. Contact the maintainers

---

**Thank you for contributing to Klinika CRM! 🎉**
