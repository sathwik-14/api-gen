import fs from 'fs';
import path from 'path';
import format from './format.js';

function pathJoin(relPath) {
  /* eslint-disable no-undef */
  const projectRoot = process.cwd();
  return path.join(projectRoot, relPath);
}

export function read(relativePath) {
  const absPath = pathJoin(relativePath);
  if (exists(relativePath)) {
    return fs.readFileSync(absPath, 'utf-8');
  }
}

export async function write(relativePath, content, options = { format: true }) {
  try {
    const absPath = pathJoin(relativePath);
    if (options.format) {
      content = await format(content, options?.parser);
    }
    fs.writeFileSync(absPath, content);
  } catch {
    console.error('FAILED WRITING TO FILE ', relativePath);
  }
}

export function append(relativePath, content) {
  try {
    const absPath = pathJoin(relativePath);
    fs.appendFileSync(absPath, content);
  } catch {
    console.error('FAILED WRITING TO FILE ', relativePath);
  }
}

export function exists(path) {
  const absPath = pathJoin(path);
  return fs.existsSync(absPath, { recursive: true });
}

export function createDirectory(path) {
  fs.mkdirSync(path);
}

export function saveConfig(data) {
  const path = 'config.json';
  if (exists(path)) {
    let configData = JSON.parse(read(path));
    configData = { ...configData, ...data };
    write(path, JSON.stringify(configData), { parser: 'json' });
  } else {
    write(path, JSON.stringify(data), { parser: 'json' });
  }
}
