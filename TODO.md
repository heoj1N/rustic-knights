## Getting Started

### Installation
1. Clone the repository:
```bash
git clone https://github.com/heoj1N/rustic-knights.git
cd rustic-knights
```

2. Set up the backend:
```bash
cd backend
cargo build
```

3. Set up the frontend:
```bash
cd frontend
npm install
npm install react react-dom @types/react @types/react-do
```

### Running the Application

1. Start the backend server:
```bash
cd backend
cargo run
```

2. Start the frontend server:
```bash
cd frontend
npx vite
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

cd backend
cargo run

# Run frontend

npx vite
or:
npm run dev

# Setup linting

npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier eslint-plugin-prettier husky lint-staged \
npx husky install \
npx husky add .husky/pre-commit "npx lint-staged" \
npm run format:check // To check formatting without making changes \
npm run format // To apply formatting \
npm run lint // To check linting without fixes \
npm run lint:fix // To automatically fix linting issues where possible \
 npx prettier --write frontend/src/game/elements/Board.ts 
// Format a specific file \
npx eslint frontend/src/game/elements/Board.ts // Lint a specific file \

# Todos:

-- GameScene l.100 \
-- Docstring Doc generation framework for ts? \
-- handleSquareSelection \
-- Pause not working \
-- Mobile View? \
-- pre-commit hook linter
