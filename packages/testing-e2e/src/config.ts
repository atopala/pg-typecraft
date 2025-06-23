import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const Config = Type.Object({
   POSTGRES_USER: Type.String({ minLength: 1 }),
   POSTGRES_PASSWORD: Type.String({ minLength: 1 }),
   POSTGRES_DATABASE: Type.String({ minLength: 1 }),
});

export const { POSTGRES_USER, POSTGRES_DATABASE, POSTGRES_PASSWORD } = Value.Parse(Config, process.env);
