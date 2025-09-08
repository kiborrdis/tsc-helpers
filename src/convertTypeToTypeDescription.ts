import * as ts from "typescript";
import type { TypeDescription } from "./types";

let ti = 0;

export const convertAwaitedTypeToTypeDescription = (
  convertedTypes: Record<string, TypeDescription>,
  type: ts.Type,
  checker: ts.TypeChecker,
  node?: ts.Node,
  depth: string = "",
): TypeDescription => {
  const awaitedType = checker.getAwaitedType(type);

  // TODO handle it better
  if (!awaitedType) {
    return {
      kind: "base",
      name: "number",
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
  depth: string = "",
): TypeDescription => {
  const nextDepth = depth + " ";
  //
  let typeDescr: TypeDescription | null = null;

  let aliasName = type.aliasSymbol?.escapedName as string;
  const aliasCoreName = type.aliasSymbol?.escapedName as string;
  const baseName = type.symbol?.escapedName;

  if (baseName === "Date") {
    return { kind: "alias", name: "_Date" };
  }

  if (type.aliasTypeArguments && type.aliasTypeArguments.length > 0) {
    const names = type.aliasTypeArguments.map(
      (t) => t.aliasSymbol?.escapedName || String(ti++),
    );

    aliasName = `${aliasName}<${names.join(", ")}>`;
  }

  let baseAlias = aliasCoreName === "Omit" || aliasCoreName === "Record";

  if (aliasName && convertedTypes[aliasName] && !baseAlias) {
    return { kind: "alias", name: aliasName };
  }

  // Current type can have property of same type down the tree, so we add placeholder to avoid infinite recursion
  if (aliasName && !baseAlias) {
    convertedTypes[aliasName] = {
      kind: "alias",
      name: "____temporary",
    };
  }

  checker.getUnknownType()
  if (type === checker.getUnknownType()) {
    typeDescr = {
      kind: "unknown",
    };
  } else if (type.isLiteral() || type.flags & ts.TypeFlags.BooleanLiteral) {
    if (type.flags & ts.TypeFlags.BooleanLiteral) {
      typeDescr = {
        kind: "literal",
        // @ts-expect-error I'm not sure yet how to handle this properly
        value: type.intrinsicName === "true" ? true : false, 
      };
    } else if(type.isLiteral()) {
      typeDescr = {
        kind: "literal",
        value:
          typeof type.value !== "object" ? type.value : type.value.base10Value,
      };
    }
  } else if (
    type === checker.getStringType() ||
    type === checker.getNumberType() ||
    type === checker.getBooleanType() ||
    type === checker.getNeverType()
  ) {
    typeDescr = {
      kind: "base",
      name: checker.typeToString(type),
    };
  } else if (type.isUnion()) {
    typeDescr = {
      kind: "union",
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
      kind: "tuple",
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
      throw new Error("Error transfroming typescript types(numberIndexType)");
    }

    typeDescr = {
      kind: "array",
      value: convertTypeToTypeDescription(
        convertedTypes,
        numberIndexType,
        checker,
        node,
        nextDepth,
      ),
    };
  } else if (
    aliasCoreName === "Record" &&
    type.getProperties().length === 0 &&
    type.aliasTypeArguments?.length === 2
  ) {
    baseAlias = true;
    typeDescr = {
      kind: "map",
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
      kind: "obj",
      key: {
        kind: "base",
        name: "string",
      },
      properties: {},
    };

    for (const prop of type.getProperties()) {
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
      if (res.kind !== "base" || res.name !== "never") {
        typeDescr.properties[prop.escapedName as string] = {
          type: res,
          optional: Boolean(ts.SymbolFlags.Optional & prop.flags),
        };
      }
    }
  }

  if (type.isTypeParameter()) {
    typeDescr = {
      // @ts-expect-error Temporary
      kind: "type_parameter",
      name: aliasName,
    };
  }

  if (aliasName && !baseAlias && typeDescr) {
    convertedTypes[aliasName] = typeDescr;
  }

  if (!typeDescr) {
    throw new Error(
      `Error transforming typescript type: ${checker.typeToString(type)}`,
    );
  }

  return aliasName && !baseAlias
    ? { kind: "alias", name: aliasName }
    : typeDescr;
};
