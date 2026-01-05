import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import tsj from 'ts-json-schema-generator';

/** @type {import('ts-json-schema-generator/dist/src/Config').Config} */

const schemaConfigList = [
  {
    config: {
      path: fileURLToPath(
        new URL('../src/node/auto-nav-sidebar/type.ts', import.meta.url),
      ),
      tsconfig: fileURLToPath(new URL('../tsconfig.json', import.meta.url)),
      type: 'MetaJson', // Or <type-name> if you want to generate schema for that one type only
    },
    outputPath: fileURLToPath(
      new URL('../meta-json-schema.json', import.meta.url),
    ),
  },
  {
    config: {
      path: fileURLToPath(
        new URL('../src/node/auto-nav-sidebar/type.ts', import.meta.url),
      ),
      tsconfig: fileURLToPath(new URL('../tsconfig.json', import.meta.url)),
      type: 'NavJson', // Or <type-name> if you want to generate schema for that one type only
    },
    outputPath: fileURLToPath(
      new URL('../nav-json-schema.json', import.meta.url),
    ),
  },
];

function generateJsonSchema(config, outputPath) {
  const schema = tsj.createGenerator(config).createSchema(config.type);
  const schemaString = JSON.stringify(schema, null, 2);
  fs.writeFile(outputPath, schemaString, err => {
    if (err) throw err;
    console.log('JSON schema generated successfully!');
    console.log(`Output path: ${outputPath}`);
  });
}

schemaConfigList.forEach(({ config, outputPath }) => {
  generateJsonSchema(config, outputPath);
});
