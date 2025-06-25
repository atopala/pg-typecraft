# pg-typecraft

A powerful TypeScript code generator that creates type-safe mappings from PostgreSQL schemas to TypeScript,
enabling type-safe SQL queries with [**postgres.js**](https://www.npmjs.com/package/postgres).

The generated code needs zero dependencies. It only needs `postgres.js` which you already use.

[![CI](https://github.com/atopala/pg-typecraft/actions/workflows/ci_github.yml/badge.svg)](https://github.com/atopala/pg-typecraft/actions/workflows/ci_github.yml)

## Table of Contents

- [Quickstart](#quickstart)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Type-Safe Query Examples](#type-safe-query-examples)
- [Configuration](#configuration)
- [CI/CD Integration](#cicd-integration)
- [Contributing](#contributing)
- [License](#license)

## Quickstart
> code sample from the example at: https://github.com/atopala/pg-typecraft

Generate the code from existing postgres db schema `one_sql`.
Option to include multiple schemas available.

```bash
npx pg-typecraft generate --schema one_sql --uri $POSTGRES_URI --outDir 'src/codegen'
```

```typescript 
import {newOneSqlSchema} from "./codegen/one_sql.schema.ts";

// postgres connection
const sql = postgres({
    host: "localhost",
    user: "postgres",
    database: "postgres",
    transform: {
        ...postgres.camel, /* don't forget about this one if generating code with --camelCaseColumns */
        undefined: null,
    }
});

// create the respective table(s) from your schema using existing postgres connection "sql"
const {Account} = newOneSqlSchema(sql);

// write strongly type SQL to insert a new record into "Account" table using helper functions 
const [newAccount] = await sql<IAccountSelect[]>`
    INSERT INTO ${Account}
        ${Account.$values({
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            status: AccountStatusUdt.CREATED
        })}
    RETURNING ${Account.$all}
`;

const [account] = await sql<IAccountSelect[]>`
    SELECT ${Account.$all}
    FROM ${Account}
    WHERE ${Account.accountId} = ${newAccount.accountId}
`
```

## Features

* Generates TypeScript types from PostgreSQL schemas
* Supports both ESM and CommonJS modules
* Type-safe SQL queries using [postgres.js](https://www.npmjs.com/package/postgres)
* Customizable naming conventions (Pascal case for tables, camel case for columns)
* Automatic enum type generation

### Snakecase vs. camelcase
Naming conventions for Postgres suggest to use **snake_case**, but JavaScript/TypeScript is very much in favor of **camelCase**.
Luckily both `postgres.js` and `pg-typecraft` are capable to offer a reliant translation layer **snake_case - camelCase** to avoid compromises.

Generate mapping code will always inject **snake_case** tables/columns into the SQL query.

Enable `camel` transformation in the postgres.js connection so that also returned results will be transformed into `camelCase`. 

Keep your Postgres as it is, or develop it using known best practices while coding in TypeScript as it should be. 

## Installation

You can either install the package locally as dev dependency:

```bash
npm install pg-typecraft --save-dev
```

Or use it directly with npx/pnpx without installation:
```bash
# Using npx (npm)
npx pg-typecraft generate --schema one_sql --uri $POSTGRES_URI --outDir 'src/codegen'

# Using pnpm
pnpm dlx pg-typecraft generate --schema one_sql --uri $POSTGRES_URI --outDir 'src/codegen'
```

Loading environment variables from local .env file:
```bash
env-cmd -x -f .env pg-typecraft generate --schema one_sql --pascalCaseTables --camelCaseColumns --uri $POSTGRES_URI --outDir 'src/codegen'
```

## Usage

### Command Line Interface

The basic command structure:

```bash
pg-typecraft generate [options]
```

### Options

- `--schema` - PostgreSQL schema name (default: "public");
- `--pascalCaseTables` - Convert table names to PascalCase
- `--camelCaseColumns` - Convert column names to camelCase
- `--uri` - PostgreSQL connection URI
- `--outDir` - Output directory for generated files
- `--help` - Show help information

### Example Usage

```bash
pg-typecraft generate --schema one_sql --pascalCaseTables --camelCaseColumns --uri $POSTGRES_URI --outDir 'src/codegen'
```

Including multiple schemas:
```bash
pg-typecraft generate --schema one_sql --schema two_sql --uri $POSTGRES_URI --outDir 'src/codegen'
```

## Type-Safe Query Examples

### Insert Operation

```typescript
import {newOneSqlSchema} from "./codegen/one_sql.schema.js";

const {Account} = newOneSqlSchema(psql);

const [newAccount] = await sql`
    INSERT INTO ${Account}
        ${Account.$values({
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            status: AccountStatusUdt.CREATED
        })}
    RETURNING ${Account.$all}
`;
```

### Select Operation with Join

```typescript
import {
    AccountStatusUdt,
    IAccountSelect,
    IOrderJson,
    newOneSqlSchema,
    OrderStatusUdt,
} from "./codegen/one_sql.schema.js";

// create tables from existing schema: Account, Order 
const {Account, Order} = newOneSqlSchema(sql);

interface AccountWithOrders extends IAccountSelect {
    // need to use IOrderJson since "createdAt" is now a string due to JSON array aggregation
    orders: Pick<IOrderJson, "orderId" | "createdAt" | "status">[];
}

const [accountWithOrders] = await sql<AccountWithOrders[]>`
    SELECT ${Account.$all},
           COALESCE(
                jsonb_agg(orders.*) FILTER (WHERE orders.* IS NOT NULL),
                '[]'
           ) as orders
    FROM ${Account}
            LEFT JOIN LATERAL (
        SELECT ${Order.orderId}, ${Order.createdAt}, ${Order.status}
        FROM ${Order}
        WHERE ${Order.accountId} = ${Account.accountId}
        ORDER BY ${Order.createdAt} DESC
        LIMIT 5
    ) orders ON true
    WHERE ${Account.accountId} = ${accountId}
    GROUP BY ${Account.accountId}`;
```

### Update Operation

```typescript
const [accountUpdated] = await sql`
    UPDATE ${Account}
    SET ${Account.$set({
        status: AccountStatusUdt.CONFIRMED,
    })}
    WHERE ${Account.accountId} = ${accountId}
    RETURNING ${Account.$all}
`;
```

## Configuration

### postgres.js Setup
> You can find the complete guide for postgres.js: https://www.npmjs.com/package/postgres 

```typescript
const sql = postgres({
    host: "localhost",
    user: "postgres",
    database: "postgres",
    transform: {
        ...postgres.camel,
        undefined: null,
    }
});
```

## CI/CD Integration

pg-typecraft can be seamlessly integrated into your CI/CD pipeline to ensure type safety and SQL query validation against your latest database schema.
This integration helps catch potential database-related issues early in the development cycle.

Please check `CI (GitHub)` workflow in this repository for a CI/CD example:
> https://github.com/atopala/pg-typecraft/actions/workflows/ci_github.yml
* Spin off a Postgres container for use during CI/CD
* Execute db migrations against the Postgres instance
* Re-generate mapping code with `pg-typecraft` and build 
* Run automated testing using the re-generated code against the newly provisioned Postgres instance

### Benefits
* Automatic type generation during build process
* Early detection of SQL query incompatibilities
* Validation against the latest database schema
* Prevention of runtime errors due to schema mismatches
* Consistent type definitions across development and production environments

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT