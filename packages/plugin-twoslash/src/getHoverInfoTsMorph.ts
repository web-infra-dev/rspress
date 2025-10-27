import { Project } from 'ts-morph';
import type { JSDocTagInfo } from 'typescript';

export interface MemberInfo {
  name: string;
  type: string;
  docs?: string;
  tags?: Array<{ name: string; text?: string }>;
  optional: boolean;
  readonly: boolean;
}

export interface InterfaceInfo {
  name: string;
  docs?: string;
  members: MemberInfo[];
  extends?: string[];
  typeParameters?: string[];
}

/**
 * Extract interface information using ts-morph
 * Alternative to twoslash-based approach
 */
export function getInterfaceInfoWithTsMorph(
  filePath: string,
  interfaceName: string,
): InterfaceInfo | null {
  const project = new Project({
    compilerOptions: {
      strict: true,
      target: 99, // ESNext
    },
    skipAddingFilesFromTsConfig: true,
  });

  const sourceFile = project.addSourceFileAtPath(filePath);
  const iface = sourceFile.getInterface(interfaceName);

  if (!iface) {
    return null;
  }

  // Extract interface documentation
  const docs = iface
    .getJsDocs()
    .map(doc => doc.getDescription())
    .join('\n')
    .trim();

  // Extract members
  const members: MemberInfo[] = iface.getProperties().map(prop => {
    const memberDocs = prop
      .getJsDocs()
      .map(doc => doc.getDescription())
      .join('\n')
      .trim();

    const tags = prop.getJsDocs().flatMap(doc =>
      doc.getTags().map(tag => ({
        name: tag.getTagName(),
        text: tag.getComment(),
      })),
    );

    return {
      name: prop.getName(),
      type: prop.getType().getText(prop),
      docs: memberDocs || undefined,
      tags: tags.length > 0 ? tags : undefined,
      optional: prop.hasQuestionToken() || false,
      readonly: prop.isReadonly(),
    };
  });

  // Extract extends clause
  const extendsTypes = iface.getExtends().map(ext => ext.getText());

  // Extract type parameters
  const typeParameters = iface.getTypeParameters().map(tp => tp.getName());

  return {
    name: iface.getName(),
    docs: docs || undefined,
    members,
    extends: extendsTypes.length > 0 ? extendsTypes : undefined,
    typeParameters: typeParameters.length > 0 ? typeParameters : undefined,
  };
}

/**
 * Extract multiple interfaces from a file
 */
export function getAllInterfacesFromFile(
  filePath: string,
): Record<string, InterfaceInfo> {
  const project = new Project({
    compilerOptions: {
      strict: true,
      target: 99,
    },
    skipAddingFilesFromTsConfig: true,
  });

  const sourceFile = project.addSourceFileAtPath(filePath);
  const interfaces = sourceFile.getInterfaces();

  const result: Record<string, InterfaceInfo> = {};

  for (const iface of interfaces) {
    const info = getInterfaceInfoWithTsMorph(filePath, iface.getName());
    if (info) {
      result[info.name] = info;
    }
  }

  return result;
}

/**
 * Extract type alias information
 */
export function getTypeAliasInfo(filePath: string, typeName: string) {
  const project = new Project({
    compilerOptions: {
      strict: true,
      target: 99,
    },
    skipAddingFilesFromTsConfig: true,
  });

  const sourceFile = project.addSourceFileAtPath(filePath);
  const typeAlias = sourceFile.getTypeAlias(typeName);

  if (!typeAlias) {
    return null;
  }

  const docs = typeAlias
    .getJsDocs()
    .map(doc => doc.getDescription())
    .join('\n')
    .trim();

  return {
    name: typeAlias.getName(),
    type: typeAlias.getType().getText(typeAlias),
    docs: docs || undefined,
    typeParameters: typeAlias.getTypeParameters().map(tp => tp.getName()),
  };
}

/**
 * Get all exported symbols from a file
 */
export function getExportedSymbols(filePath: string) {
  const project = new Project({
    compilerOptions: {
      strict: true,
      target: 99,
    },
    skipAddingFilesFromTsConfig: true,
  });

  const sourceFile = project.addSourceFileAtPath(filePath);

  return {
    interfaces: sourceFile.getInterfaces().map(i => i.getName()),
    types: sourceFile.getTypeAliases().map(t => t.getName()),
    classes: sourceFile.getClasses().map(c => c.getName() || '<anonymous>'),
    functions: sourceFile.getFunctions().map(f => f.getName() || '<anonymous>'),
    variables: sourceFile.getVariableDeclarations().map(v => v.getName()),
  };
}
