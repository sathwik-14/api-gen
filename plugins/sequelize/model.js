import {
  createDirectory,
  exists,
  read,
  write,
  capitalize,
} from '../../utils/index.js';

const getExportedNames = (content) => {
  try {
    const exportRegex = /module\.exports\s*=\s*{([^}]*)}/;
    const match = content.match(exportRegex);
    if (match && match[1]) {
      const namesString = match[1].trim();
      return namesString
        .split(',')
        .map((name) => name.trim())
        .filter((name) => name !== '')
        .join(',');
    }
    return [].join(',');
  } catch {
    return [].join(',');
  }
};

const updateIndex = async (
  modelsDirectory,
  modelName,
  capitalizedServiceName,
  //uncomment below param for association
  // model,
) => {
  const indexFilePath = `${modelsDirectory}/index.js`;
  let indexContent = `// imports

// associations

// exports
module.exports = {
}`;

  if (exists(indexFilePath)) {
    let tempContent = read(indexFilePath);
    if (tempContent.length) {
      indexContent = tempContent;
    }
  }

  const importLine = `const ${capitalizedServiceName} = require('./${modelName.toLowerCase()}');`;
  const exportLine = `${capitalizedServiceName},`;

  // const association = generateAssociation(modelName, model);
  const importsCommentIndex = indexContent.indexOf('// imports');
  if (importsCommentIndex != -1 && !indexContent.includes(importLine)) {
    const nextLineIndex = indexContent.indexOf(
      '\n',
      importsCommentIndex + '// imports'.length,
    );
    const importLines = `\n${importLine}`;
    indexContent =
      indexContent.slice(0, nextLineIndex) +
      importLines +
      indexContent.slice(nextLineIndex);
  }

  const moduleExportsIndex = indexContent.indexOf('module.exports = {');
  const exports = getExportedNames(indexContent);

  if (
    moduleExportsIndex !== -1 &&
    !exports.includes(exportLine.replace(',', ''))
  ) {
    const nextLineIndex = indexContent.indexOf(
      '\n',
      moduleExportsIndex + 'module.exports = {'.length,
    );
    const exportLines = `\n${exportLine}`;
    indexContent =
      indexContent.slice(0, nextLineIndex) +
      exportLines +
      indexContent.slice(nextLineIndex);
  }

  // const associationCommentIndex = indexContent.indexOf('// associations');
  // if (associationCommentIndex !== -1) {
  //   const nextAssociationIndex = indexContent.indexOf(
  //     '\n',
  //     associationCommentIndex + '// associations'.length,
  //   );
  //   const associationFormatted = `\n${association}`;
  //   if (!indexContent.includes(association)) {
  //     indexContent =
  //       indexContent.slice(0, nextAssociationIndex) +
  //       associationFormatted +
  //       indexContent.slice(nextAssociationIndex);
  //     console.log(
  //       `${modelName} model associations appended to the models/index file.`,
  //     );
  //   } else {
  //     console.log(
  //       `${modelName} model associations already exist in the models/index file. Skipped.`,
  //     );
  //   }
  // } else {
  //   console.log('Missing comment for associations. Unable to append.');
  // }

  await write(indexFilePath, indexContent, { force: true });
};

// uncomment for association definition

// const mapRelationshipType = (relationshipType) => {
//   switch (relationshipType.toLowerCase()) {
//     case 'one-to-one':
//       return 'belongsTo';
//     case 'one-to-many':
//       return 'belongsTo';
//     case 'many-to-one':
//       return 'hasMany';
//     case 'many-to-many':
//       return 'belongsToMany';
//     default:
//       throw new Error('Unsupported relationship type.');
//   }
// };

// const inverseMapRelationshipType = (relationshipType) => {
//   switch (relationshipType.toLowerCase()) {
//     case 'one-to-one':
//       return 'hasOne';
//     case 'one-to-many':
//       return 'hasMany';
//     case 'many-to-one':
//       return 'belongsTo';
//     case 'many-to-many':
//       return 'belongsToMany';
//     default:
//       throw new Error('Unsupported relationship type.');
//   }
// };

// const generateAssociation = (modalName, modalData) => {
//   let inverseAssociation = '';
//   let association = '';
//   modalData.forEach((field) => {
//     if (field.foreignKey) {
//       const associationType = mapRelationshipType(field.relationshipType);
//       if (field.selfMapping && field.mapRef) {
//         association = `${capitalize(modalName)}.${associationType}(${capitalize(field.mapRef)}, { through:${capitalize(modalName)}, foreignKey: '${field.name}' });`;
//       } else {
//         association = `${capitalize(modalName)}.${associationType}(${capitalize(field.refTable)}, { foreignKey: '${field.name}' });`;
//       }
//       const inverseAssociationType = inverseMapRelationshipType(
//         field.relationshipType,
//       );
//       if (field.selfMapping && field.mapRef) {
//         inverseAssociation = `${capitalize(field.refTable)}.${inverseAssociationType}(${capitalize(field.mapRef)}, { through:${capitalize(modalName)}, foreignKey: '${field.name}' });`;
//       } else {
//         inverseAssociation = `${capitalize(field.refTable)}.${inverseAssociationType}(${capitalize(modalName)}, { foreignKey: '${field.name}' });`;
//       }
//     }
//   });
//   return `${association}\n${inverseAssociation}`;
// };

const formatDefaultValue = (type, value) => {
  if (type.toLowerCase() == 'date' || type.toLowerCase() == 'datetime')
    return `sequelize.literal('${value}')`;
};

const generateModel = async (modelName, model) => {
  const modelsDirectory = 'models';
  const capitalizedServiceName = capitalize(modelName);
  if (!model.length) return;
  const customFields = model
    .map((field) => {
      let fieldDefinition = `  ${field.name}: { type: DataTypes.${field.type}`;
      if (field.primaryKey) {
        fieldDefinition += `, primaryKey:true`;
      }
      if (field.defaultValue !== null && field.defaultValue != '') {
        fieldDefinition += `, defaultValue: ${formatDefaultValue(field.type, field.defaultValue)}`;
      }
      if (!field.allowNulls) {
        fieldDefinition += `, allowNull: false`;
      }
      if (field.unique) {
        fieldDefinition += `, unique: true`;
      }
      if (field.foreignKey) {
        fieldDefinition += `, references: { model: '${field.refTable}', key: '${field.refField}' }`;
      }
      if (field.foreignKey && field.relationshipType) {
        fieldDefinition += `, as: '${field.refTable}', onDelete: 'CASCADE'`;
      }
      fieldDefinition += ' }';
      return fieldDefinition;
    })
    .join(',\n');
  const modelContent = `\n
  // Sequelize schema for ${modelName}\n
  const { sequelize } = require("../config/db");
 const { DataTypes } = require("sequelize");\n
   const ${capitalizedServiceName} = sequelize.define('${modelName.toLowerCase()}', {\n
          ${customFields}\n
            });
\n
   ${capitalizedServiceName}.sync()
   .then(() => console.log('${modelName} model synced successfully'))
   .catch(err => console.log('${modelName} model sync failed',err));

   module.exports = ${capitalizedServiceName};
\n  `;
  if (!exists(modelsDirectory)) {
    createDirectory(modelsDirectory);
  }
  await write(`${modelsDirectory}/${modelName.toLowerCase()}.js`, modelContent);
  await updateIndex(
    modelsDirectory,
    modelName,
    capitalizedServiceName,
    // uncomment below for association
    // model
  );
};

export { generateModel };
