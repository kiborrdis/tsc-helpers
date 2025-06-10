import * as ts from 'typescript';
import { debugLog } from './debugLog';

type VisitFn = (accept: OutVisitFn, node: ts.Node) => void;
type OutVisitFn = (node: ts.Node) => void;

export const createVisitRules = (
  visitRules: Partial<Record<ts.SyntaxKind, VisitFn | VisitFn[]>>,
): OutVisitFn => {
  const accept: OutVisitFn = (node) => {
    const rule = visitRules[node.kind];

    if (rule) {
      debugLog('accept', ts.SyntaxKind[node.kind]);

      if (Array.isArray(rule)) {
        rule.forEach((fn) => fn(accept, node));
      } else {
        rule(accept, node);
      }
    }
  };

  return accept;
};

export const traverseAllChildren: VisitFn = (accept, node) => {
  ts.forEachChild(node, (child) => {
    accept(child);
  });
};
