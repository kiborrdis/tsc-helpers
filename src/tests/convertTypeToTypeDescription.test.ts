import { describe, it, expect } from "vitest";
import * as ts from "typescript";
import { createVisitRules, traverseAllChildren } from "../traverseAST";
import { convertTypeToTypeDescription } from "../convertTypeToTypeDescription";
import { ObjTypeDescription, TypeDescription } from "../types";

describe("convertTypeToTypeDescription", () => {
  const program = ts.createProgram(["./src/tests/test-types.ts"], {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
  });
  const checker = program.getTypeChecker();

  it("should return proper type with boolean", () => {
    const types: Record<string, TypeDescription> = {};
    const [type, node] = getFindTypeWithName(
      program,
      checker,
      "BooleanObjectType",
    );
    convertTypeToTypeDescription(types, type, checker, node);

    expect(types["BooleanObjectType"]).toEqual({
      key: {
        kind: "base",
        name: "string",
      },
      kind: "obj",
      properties: {
        test: {
          optional: false,
          type: {
            kind: "base",
            name: "boolean",
          },
        },
      },
    });
  });

  it("should properly convert boolean literal", () => {
    const types: Record<string, TypeDescription> = {};
    const [type, node] = getFindTypeWithName(
      program,
      checker,
      "BooleanLiteralObjectType",
    );
    convertTypeToTypeDescription(types, type, checker, node);
    expect(types["BooleanLiteralObjectType"]).toEqual({
      key: {
        kind: "base",
        name: "string",
      },
      kind: "obj",
      properties: {
        test: {
          optional: false,
          type: {
            kind: "literal",
            value: true,
          },
        },
      },
    });
  });

  it("should properly convert record of unknowns literal", () => {
    const types: Record<string, TypeDescription> = {};
    const [type, node] = getFindTypeWithName(
      program,
      checker,
      "UnknownsRecordType",
    );
    convertTypeToTypeDescription(types, type, checker, node);
    expect(types["UnknownsRecordType"]).toEqual({
      kind: "obj",
      key: {
        kind: "base",
        name: "string",
      },
      properties: {
        test: {
          optional: false,
          type: {
            key: {
              kind: "base",
              name: "string",
            },
            value: {
              kind: "unknown",
            },
            kind: "map",
          },
        },
      },
    } satisfies ObjTypeDescription);
  });


  it("should properly convert display style type", () => {
    const types: Record<string, TypeDescription> = {};
    const [type, node] = getFindTypeWithName(
      program,
      checker,
      "NotOptionals",
    );
    convertTypeToTypeDescription(types, type, checker, node);
    expect(types["NotOptionals"]).toEqual({
      kind: "obj",
      key: {
        kind: "base",
        name: "string",
      },
      properties: {
        str: {
          optional: false,
          type: {
            kind: "base",
            name: "number",
          },
        },
        num: {
          optional: false,
          type: {
            kind: "base",
            name: "string",
          },
        },
      },
    });
  });

  it("should properly convert display style type", () => {
    const types: Record<string, TypeDescription> = {};
    const [type, node] = getFindTypeWithName(
      program,
      checker,
      "Optionals",
    );
    convertTypeToTypeDescription(types, type, checker, node);
    expect(types["Optionals"]).toEqual({
      kind: "obj",
      key: {
        kind: "base",
        name: "string",
      },
      properties: {
        str: {
          optional: true,
          type: {
            kind: "base",
            name: "number",
          },
        },
        num: {
          optional: true,
          type: {
            kind: "base",
            name: "string",
          },
        },
      },
    });
  });
});

const getFindTypeWithName = (
  program: ts.Program,
  typeChecker: ts.TypeChecker,
  typeName: string,
): [ts.Type, ts.Node] => {
  let foundType: ts.Type | undefined = undefined;
  let foundNode: ts.Node | undefined = undefined;

  const accept = createVisitRules({
    [ts.SyntaxKind.SourceFile]: [traverseAllChildren],
    [ts.SyntaxKind.TypeAliasDeclaration]: [
      (_, node) => {
        if (!ts.isTypeAliasDeclaration(node)) {
          return;
        }

        const typeAlias = typeChecker.getTypeAtLocation(node);
        if (node.name.getText() === typeName) {
          foundType = typeAlias;
          foundNode = node;
        }
      },
    ],
    [ts.SyntaxKind.InterfaceDeclaration]: [
      (_, node) => {
        if (!ts.isInterfaceDeclaration(node)) {
          return;
        }
        const typeAlias = typeChecker.getTypeAtLocation(node);

        if (node.name.getText() === typeName) {
          foundType = typeAlias;
          foundNode = node;
        }
      },
    ],
  });

  const sourceFiles = program.getSourceFiles();

  sourceFiles.forEach((sourceFile) => {
    if (sourceFile.fileName.includes("test-types")) {
      accept(sourceFile);
    }
  });

  if (!foundNode || !foundType) {
    throw new Error("Test type or node not found");
  }

  return [foundType, foundNode];
};
