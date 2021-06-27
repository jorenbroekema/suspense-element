import { createRequire } from 'module';
import { promises as fs } from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const marked = require('marked');

marked.setOptions({
  renderer: new marked.Renderer(),
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

    // Pick a highlight.js theme and put it in the rootfolder so this folder can
    // be deployed and work anywhere (e.g. netlify, heroku, whatever).
    await fs.copyFile(
      path.resolve('node_modules', 'highlight.js', 'styles', 'hybrid.css'),
      path.resolve(rootFolder, 'highlight-hybrid.css'),
    );
  }
};
