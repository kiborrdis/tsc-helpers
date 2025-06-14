import * as ts from 'typescript';
import { TypeDescription } from './types';

let ti = 0;

export const convertAwaitedTypeToTypeDescription = (
  convertedTypes: Record<string, TypeDescription>,
  type: ts.Type,
  checker: ts.TypeChecker,
  node?: ts.Node,
  depth: string = '',
): TypeDescription => {
  const awaitedType = checker.getAwaitedType(type);

  // TODO handle it better
  if (!awaitedType) {
    return {
      kind: 'base',
      name: 'number',
    };
  }

  return convertTypeToTypeDescription(
    convertedTypes,
    awaitedType,
    checker,
    node,
    depth,
  );
};

export const convertTypeToTypeDescription = (
  convertedTypes: Record<string, TypeDescription>,
  type: ts.Type,
  checker: ts.TypeChecker,
  node?: ts.Node,
  depth: string = '',
): TypeDescription => {
  let nextDepth = depth + ' ';
  let typeDescr: any = {};

  let aliasName = type.aliasSymbol?.escapedName as string;
  let aliasCoreName = type.aliasSymbol?.escapedName as string;
  let baseName = type.symbol?.escapedName;

  if (baseName === 'Date') {
    return { kind: 'alias', name: '_Date' };
  }

  if (type.aliasTypeArguments && type.aliasTypeArguments.length > 0) {
    const names = type.aliasTypeArguments.map(
      (t) => t.aliasSymbol?.escapedName || String(ti++),
    );

    aliasName = `${aliasName}<${names.join(', ')}>`;
  }

  let baseAlias = aliasCoreName === 'Omit' || aliasCoreName === 'Record';

  if (aliasName && convertedTypes[aliasName] && !baseAlias) {
    return { kind: 'alias', name: aliasName };
  }

  // Current type can have property of same type down the tree, so we add placeholder to avoid infinite recursion
  if (aliasName && !baseAlias) {
    convertedTypes[aliasName] = {
      kind: 'alias',
      name: '____temporary',
    };
  }

  if (type.isLiteral()) {
    typeDescr = {
      kind: 'literal',
      value: type.value,
    };
  } else if (
    type === checker.getStringType() ||
    type === checker.getNumberType() ||
    type === checker.getBooleanType() ||
    type === checker.getNeverType()
  ) {
    typeDescr = {
      kind: 'base',
      name: checker.typeToString(type),
    };
  } else if (type.isUnion()) {
    typeDescr = {
      kind: 'union',
      variants: type.types.map((t) =>
        convertTypeToTypeDescription(
          convertedTypes,
          t,
          checker,
          node,
          nextDepth,
        ),
      ),
    };
  } else if (checker.isTupleType(type)) {
    typeDescr = {
      kind: 'tuple',
      values: checker.getTypeArguments(type as ts.TypeReference).map((t) => {
        return convertTypeToTypeDescription(
          convertedTypes,
          t,
          checker,
          node,
          nextDepth,
        );
      }),
    };
  } else if (checker.isArrayType(type)) {
    const numberIndexType = type.getNumberIndexType();

    if (!numberIndexType) {
      throw new Error('Error transfroming typescript types(numberIndexType)');
    }

    typeDescr = {
      kind: 'array',
      value: convertTypeToTypeDescription(
        convertedTypes,
        numberIndexType,
        checker,
        node,
        nextDepth,
      ),
    };
  } else if (
    aliasCoreName === 'Record' &&
    type.getProperties().length === 0 &&
    type.aliasTypeArguments?.length === 2
  ) {
    baseAlias = true;
    typeDescr = {
      kind: 'map',
      key: convertTypeToTypeDescription(
        convertedTypes,
        type.aliasTypeArguments[0],
        checker,
        node,
        nextDepth,
      ),
      value: convertTypeToTypeDescription(
        convertedTypes,
        type.aliasTypeArguments[1],
        checker,
        node,
        nextDepth,
      ),
    };
  } else {
    typeDescr = {
      kind: 'obj',
      properties: {},
    };

    for (let prop of type.getProperties()) {
      const propType = node
        ? checker.getTypeOfSymbolAtLocation(prop, node)
        : checker.getTypeOfSymbol(prop);

      const res = convertTypeToTypeDescription(
        convertedTypes,
        propType,
        checker,
        node,
        nextDepth,
      );
      if (res.kind !== 'base' || res.name !== 'never') {
        typeDescr.properties[prop.escapedName as string] = {
          type: res,
          optional: Boolean(ts.SymbolFlags.Optional & prop.flags),
        };
      }
    }
  }

  if (type.isTypeParameter()) {
    typeDescr = {
      kind: 'type_parameter',
      name: aliasName,
    };
  }

  if (aliasName && !baseAlias) {
    convertedTypes[aliasName] = typeDescr;
  }

  return aliasName && !baseAlias
    ? { kind: 'alias', name: aliasName }
    : typeDescr;
};
