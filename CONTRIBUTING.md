# Contributing Guide

Thank you for your interest in contributing to the Arun Bites QR Ordering System! We welcome contributions from developers of all skill levels.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/vendor-qr-system.git
   cd vendor-qr-system
   ```
3. **Create a new branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

Follow the [SETUP.md](SETUP.md) guide to set up your development environment.

## Code Standards

### Python (Backend)

- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guide
- Use meaningful variable and function names
- Add docstrings to functions and classes:
  ```python
  def calculate_priority(items_count: int, is_prepaid: bool) -> int:
      """
      Calculate order priority based on item count and payment method.
      
      Args:
          items_count: Number of items in the order
          is_prepaid: Whether order is prepaid (UPI)
      
      Returns:
          Priority score (higher = more priority)
      """
  ```

### JavaScript (Frontend)

- Use modern ES6+ syntax
- Use meaningful variable names
- Add comments for complex logic:
  ```javascript
  // Fetch menu items from backend and render them
  async function loadMenu() {
      try {
          const response = await fetch(`${API_URL}/menu`);
          const items = await response.json();
          renderMenu(items);
      } catch (error) {
          console.error('Failed to load menu:', error);
      }
  }
  ```

### HTML/CSS

- Use semantic HTML elements
- Use BEM naming convention for CSS classes: `.block__element--modifier`
- Ensure responsive design works on mobile and desktop

## Making Changes

### For Bug Fixes

1. Create a branch: `git checkout -b fix/bug-description`
2. Make your changes
3. Test thoroughly
4. Commit with clear message: `git commit -m 'Fix: Description of fix'`

### For New Features

1. Create a branch: `git checkout -b feature/feature-name`
2. Implement the feature
3. Add/update tests if applicable
4. Update documentation (README.md, etc.) if needed
5. Commit with clear message: `git commit -m 'Feature: Description of feature'`

## Commit Messages

Follow conventional commit format:

```
type(scope): subject

body

footer
```

Types:
- `feat:` A new feature
- `fix:` A bug fix
- `doc:` Documentation changes
- `style:` Code style changes (formatting, missing semicolons, etc.)
- `refactor:` Code refactoring without feature changes
- `perf:` Performance improvements
- `test:` Test additions or updates

Example:
```
feat(orders): add real-time order status updates via WebSocket

Implement WebSocket connection manager to broadcast order updates
to vendor dashboard in real-time.

Closes #123
```

## Testing

### Manual Testing Checklist

- [ ] Test on Chrome/Firefox/Safari
- [ ] Test on mobile (use browser dev tools device emulation)
- [ ] Test navigation between pages
- [ ] Test adding/removing items from cart
- [ ] Test order submission
- [ ] Test vendor dashboard updates
- [ ] Test WebSocket connection (real-time updates)

### Backend Testing

When adding new endpoints:
1. Test with both valid and invalid inputs
2. Check error handling
3. Verify database changes are correct

Use the interactive API docs at http://localhost:8000/docs for testing.

## Pull Request Process

1. **Update your branch** with latest main:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request** on GitHub with:
   - Clear title describing the change
   - Description of what was changed and why
   - Reference to related issues (#123)
   - Screenshots for UI changes

4. **Address review comments** and update as needed

## Code Review

When your PR is under review:
- Be open to feedback and suggestions
- Discuss any points of disagreement respectfully
- Update code based on feedback and re-request review

When reviewing others' PRs:
- Be constructive and helpful
- Focus on code quality, not personal style preferences
- Acknowledge good work

## Project Structure

```
vendor-qr-system/
├── backend/
│   └── Add new endpoints in main.py
│   └── Add new models in models.py
│   └── Add new schemas in schemas.py
├── frontend/
│   └── Add new HTML files for new pages
│   └── Add UI logic in script.js
│   └── Add styling in style.css
└── Documentation files (README.md, SETUP.md, etc.)
```

## Reporting Issues

### Bug Reports

Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots/error messages
- Your environment (OS, Python version, etc.)

### Feature Requests

Include:
- Problem you're trying to solve
- Proposed solution
- Alternative solutions considered
- Use cases

## Questions?

- Check existing [Issues](https://github.com/yourusername/vendor-qr-system/issues)
- Check [Discussions](https://github.com/yourusername/vendor-qr-system/discussions)
- Read [README.md](README.md) and [SETUP.md](SETUP.md)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for making Arun Bites better! 🙏
