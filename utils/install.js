import { execSync, exec } from 'node:child_process';
import { read } from './index.js';

const install = (packages, options = { sync: true, dev: false }) => {
  try {
    let packageJson = JSON.parse(read('package.json'));
    const existingDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    packages.forEach((pkg) => {
      if (existingDependencies[pkg]) {
        return;
      }
      if (options.sync)
        execSync(`npm install ${options.dev ? '-D' : ''} ${pkg}`);
      else exec(`npm install ${options.dev ? '-D' : ''} ${pkg}`);
    });
  } catch {
    console.error('Error installing packages:', ...packages);
  }
};

export { install };
