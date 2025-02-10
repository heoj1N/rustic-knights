# Setup

cd backend
cargo run

# Run frontend

npx vite
or:
npm run dev

# Setup linting

npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier eslint-plugin-prettier husky lint-staged

npx husky install
npx husky add .husky/pre-commit "npx lint-staged"

# To check formatting without making changes
npm run format:check

# To apply formatting
npm run format

# To check linting without fixes
npm run lint

# To automatically fix linting issues where possible
npm run lint:fix

# Format a specific file
npx prettier --write frontend/src/game/elements/Board.ts

# Lint a specific file
npx eslint frontend/src/game/elements/Board.ts --fix