import fs from 'node:fs';
import tsj from 'ts-json-schema-generator';

/** @type {import('ts-json-schema-generator/dist/src/Config').Config} */

const schemaConfigList = [
  {
    config: {
      path: new URL(
        '../../core/src/node/auto-nav-sidebar/type.ts',
        import.meta.url,
      ).pathname,
      tsconfig: new URL('../../core/tsconfig.json', import.meta.url).pathname,
      type: 'MetaJson', // Or <type-name> if you want to generate schema for that one type only
    },
    outputPath: new URL('../meta-json-schema.json', import.meta.url).pathname,
  },
  {
    config: {
      path: new URL(
        '../../core/src/node/auto-nav-sidebar/type.ts',
        import.meta.url,
      ).pathname,
      tsconfig: new URL('../../core/tsconfig.json', import.meta.url).pathname,
      type: 'NavJson', // Or <type-name> if you want to generate schema for that one type only
    },
    outputPath: new URL('../nav-json-schema.json', import.meta.url).pathname,
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
