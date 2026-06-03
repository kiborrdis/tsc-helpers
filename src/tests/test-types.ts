// eslint-disable-next-line @typescript-eslint/no-unused-vars
type BooleanObjectType = {
  test: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type BooleanLiteralObjectType = {
  test: true;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type UnknownsRecordType = {
  test: Record<string, unknown>;
};

export type Optionals = {
  str?: number;
  num?: string;
};

export type NotOptionals = {
  str: number;
  num: string;
};