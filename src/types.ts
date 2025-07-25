// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type RootTypeDescription<T extends string, D extends {}> = {
  kind: T;
} & D;

export type TypeDescription =
  | BaseTypeDescription
  | LiteralTypeDescription
  | UnionTypeDescription
  | TupleTypeDescription
  | ArrayTypeDescription
  | MapTypeDescription
  | ObjTypeDescription
  | AliasTypeDescription;

type BaseTypeDescription = RootTypeDescription<
  "base",
  {
    name: string;
  }
>;
type LiteralTypeDescription = RootTypeDescription<
  "literal",
  {
    value: string | number | boolean;
  }
>;
type UnionTypeDescription = RootTypeDescription<
  "union",
  {
    variants: TypeDescription[];
  }
>;
type TupleTypeDescription = RootTypeDescription<
  "tuple",
  {
    values: TypeDescription[];
  }
>;
type ArrayTypeDescription = RootTypeDescription<
  "array",
  {
    value: TypeDescription;
  }
>;

type MapTypeDescription = RootTypeDescription<
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

type AliasTypeDescription = RootTypeDescription<
  "alias",
  {
    name: string;
  }
>;
