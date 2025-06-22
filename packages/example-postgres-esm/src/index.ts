import postgres from "postgres";
import * as console from "node:console";
import * as crypto from "node:crypto";
import {ok} from "node:assert";
import {
    AccountStatusUdt,
    IAccountSelect,
    IOrderJson,
    newOneSqlSchema,
    OrderStatusUdt,
} from "./codegen/one_sql.schema.js";

const psql = postgres({
    host: "localhost",
    user: "postgres",
    database: "postgres",
    transform: {
        ...postgres.camel,
        undefined: null,
    },
    debug: (...args) => {
        console.log("sql:", ...args);
    },
});

const {Account, Order} = newOneSqlSchema(psql);

const id = crypto.randomUUID().slice(0, 4);
const [newAccount] = await psql<IAccountSelect[]>`
    insert into ${Account}
        ${Account.$values({
            status: AccountStatusUdt.CREATED,
            firstName: `John_${id}`,
            lastName: `Doe_${id}`,
            email: `test_${id}@example.com`,
        })}
        returning ${Account.$all}
`;
console.log("new account:", newAccount);
ok(newAccount?.accountId, "accountId is required");

const newOrders = await psql`
    INSERT INTO ${Order}
        ${Order.$values({
            accountId: newAccount.accountId,
            status: OrderStatusUdt.CREATED,
            createdAt: new Date(),
            modifiedAt: new Date(),
        }, {
            accountId: newAccount.accountId,
            status: OrderStatusUdt.DELIVERED,
            createdAt: new Date(),
            modifiedAt: new Date(),
        })}
        RETURNING ${Order.$all}
`;
ok(newOrders?.length);

const [accountUpdated] = await psql`
    update ${Account}
    set ${Account.$set({
        status: AccountStatusUdt.CONFIRMED,
    })}
    where ${Account.accountId} = ${newAccount.accountId}
    returning ${Account.$all}
`;
console.log("account updated:", accountUpdated);

interface AccountWithOrders extends IAccountSelect {
    orders: Pick<IOrderJson, "orderId" | "createdAt" | "status">[];
}

const [accountWithLimitedOrders] = await psql<AccountWithOrders[]>`
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
        LIMIT 5 -- Get only the 5 most recent orders
        ) orders ON true
    WHERE ${Account.accountId} = ${newAccount.accountId}
    GROUP BY ${Account.accountId}`;

console.log("account with orders:\n", accountWithLimitedOrders);

await psql.end();
