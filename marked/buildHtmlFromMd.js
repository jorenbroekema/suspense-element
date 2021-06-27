import module from 'module';
import { promises as fs } from 'fs';
import path from 'path';

const require = module.createRequire(import.meta.url);
const marked = require('marked');

marked.setOptions({
  renderer: new marked.Renderer(),
  /**
   * @param {string} code
   * @param {string} lang
   * @returns
   */
  highlight: (code, lang) => {
    const hljs = require('highlight.js');

    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
});

const rootFolder = path.resolve('demo');

export const buildHtmlFromMd = async () => {
  const newsFolder = await fs.lstat(path.resolve(rootFolder));
  if (newsFolder.isDirectory()) {
    const template = await fs.readFile(path.resolve(rootFolder, 'template.html'), 'utf-8');

    const markdownString = await fs.readFile(path.resolve('README.md'), 'utf-8');
    const htmlString = marked(markdownString);

    await fs.writeFile(
      path.resolve(rootFolder, `index.html`),
      template.replace('{{ content }}', htmlString),
    );
  }
};
