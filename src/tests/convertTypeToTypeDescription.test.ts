import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { debugLog } from "../debugLog";
import * as ts from "typescript";
import { createVisitRules, traverseAllChildren } from "../traverseAST";
import { convertTypeToTypeDescription } from "../convertTypeToTypeDescription";
import { TypeDescription } from "../types";

describe("debugLog", () => {
  const program = ts.createProgram(["./src/tests/test-types.ts"], {
    target: ts.ScriptTarget.ES5,
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
    console.log(`Found type: ${type}, node: ${node}`);
    if (!type || !node) {
      throw new Error("Test type or node not found");
    }

    const converted = convertTypeToTypeDescription(types, type, checker, node);

    expect(types["BooleanObjectType"]).toMatchObject({
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
});


const getFindTypeWithName = (
  program: ts.Program,
  typeChecker: ts.TypeChecker,
  typeName: string,
): [ts.Type | undefined, ts.Node | undefined] => {
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

  return [foundType, foundNode];
};
