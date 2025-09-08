// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type RootTypeDescription<T extends string, D extends {}> = {
  kind: T;
} & D;

export type TypeDescription =
  | UnknownTypeDescription
  | BaseTypeDescription
  | LiteralTypeDescription
  | UnionTypeDescription
  | TupleTypeDescription
  | ArrayTypeDescription
  | MapTypeDescription
  | ObjTypeDescription
  | AliasTypeDescription;

export type BaseTypeDescription = RootTypeDescription<
  "base",
  {
    name: string;
  }
>;
export type UnknownTypeDescription = RootTypeDescription<
  "unknown",
  {}
>;
export type LiteralTypeDescription = RootTypeDescription<
  "literal",
  {
    value: string | number | boolean;
  }
>;
export type UnionTypeDescription = RootTypeDescription<
  "union",
  {
    variants: TypeDescription[];
  }
>;
export type TupleTypeDescription = RootTypeDescription<
  "tuple",
  {
    values: TypeDescription[];
  }
>;
export type ArrayTypeDescription = RootTypeDescription<
  "array",
  {
    value: TypeDescription;
  }
>;

export type MapTypeDescription = RootTypeDescription<
  "map",
  {
    key: TypeDescription;
    value: TypeDescription;
  }
>;

export type ObjTypeDescription = RootTypeDescription<
  "obj",
  {
    key: TypeDescription;
    properties: Record<
      string,
      {
        optional?: boolean;
        type: TypeDescription;
      }
    >;
  }
>;

export type AliasTypeDescription = RootTypeDescription<
  "alias",
  {
    name: string;
  }
>;
