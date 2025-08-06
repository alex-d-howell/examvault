import { UserConfigFn } from 'vite';
import { overrideVaadinConfig } from './vite.generated';
import path from 'path';

const customConfig: UserConfigFn = (env) => ({
  plugins: [],
  test: {
    include: ['./tests/**/*.{test,spec}.ts?(x)'],
    globals: true,
    environment: 'jsdom',
    setupFiles: path.resolve(__dirname, 'src/main/frontend/tests/setupTests.tsx')
  },
});

export default overrideVaadinConfig(customConfig);
