import { playwrightLauncher } from '@web/test-runner-playwright';
import baseConfig from './web-test-runner.config.mjs';

export default {
  ...baseConfig,
  browsers: [playwrightLauncher({ product: 'webkit' })],
};
