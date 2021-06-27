import module from 'module';

const require = module.createRequire(import.meta.url);
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const html = require('@web/rollup-plugin-html').default;

export default {
  output: { dir: 'dist' },
  plugins: [
    html({
      input: './demo/index.html',
    }),
    nodeResolve(),
  ],
};
