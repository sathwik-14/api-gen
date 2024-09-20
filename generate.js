#!/usr/bin/env node

import template from './templates/content.js';
import { read, saveConfig, write } from './utils/index.js';
import { joi, prisma, sequelize } from './plugins/index.js';
import sampledata from './sampledata.js';
import chalk from 'chalk';
// uncomment below import to work with custom input
// import { schemaPrompts } from './prompt.js';

let state;

const loadState = (input) => {
  try {
    const config = read('config.json');
    if (config.length !== 0) {
      state = JSON.parse(config);
    }
  } catch {
    state = input;
  }
};

const authMiddleware = (roles) => {
  if (state.authentication && roles.length) {
    return `userAuth, checkRole(${JSON.stringify(roles)}), `;
  } else if (state.authentication) {
    return 'userAuth, ';
  }
  return '';
};

const updateRouteInMain = async (routeName, roles = []) => {
  const importContent = `const ${routeName}Routes = require("./${routeName}");`;
  const routeContent = `router.use("/${routeName}",${authMiddleware(roles)}${routeName}Routes);`;
  const mainFileContent = read('routes/index.js');
  const lines = mainFileContent.split('\n');
  const importRoutesIndex = lines.findIndex((line) =>
    line.includes('// import routes'),
  );
  if (
    importRoutesIndex !== -1 &&
    !lines.some((line) => line.includes(importContent))
  ) {
    lines.splice(importRoutesIndex + 1, 0, importContent);
    await write('routes/index.js', lines.join('\n'));
  }

  const useRoutesIndex = lines.findIndex((line) => line.includes('// routes'));
  if (
    useRoutesIndex !== -1 &&
    !lines.some((line) => line.includes(routeContent))
  ) {
    lines.splice(useRoutesIndex + 1, 0, routeContent);
    await write('routes/index.js', lines.join('\n'));
  }
};

const generateRoutes = async (routeName, roles, model) => {
  await write(
    `routes/${routeName}.js`,
    template.routesContent(routeName, model),
  );
  await updateRouteInMain(routeName, roles);
};

const scaffold = async (input) => {
  try {
    let schemaData;
    loadState(input);
    if (input.schema) {
      schemaData = input.schema;
    } else {
      // uncomment the below code to enter schema manually and uncommer import also for schemaPrompts
      // schemaData = await schemaPrompts(input);
      // checkout sampledata.js for predefined schemas - faster development
      schemaData = sampledata.blogs;
    }
    await joi.setup();
    if (Object.keys(schemaData).length) {
      for (const [key, value] of Object.entries(schemaData)) {
        const modelName = key;
        const model = value;
        const db = state.db;
        const orm = state.orm;
        switch (orm) {
          case 'prisma':
            prisma.model(modelName, model, db);
            prisma.generate();
            prisma.controller(modelName);
            break;
          case 'sequelize':
            await sequelize.model(modelName, model);
            sequelize.controller(modelName);
            break;
        }
        await joi.schema(modelName, model);
        await generateRoutes(modelName, [], model);
      }
    }
    saveConfig({ schema: schemaData });
  } catch (err) {
    console.error(chalk.bgRed`ERROR`, err);
  }
};

export { scaffold, generateRoutes };
