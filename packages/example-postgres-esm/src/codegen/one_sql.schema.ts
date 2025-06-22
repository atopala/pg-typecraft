export type * from "./one_sql.product-table.js";
export type * from "./one_sql.account-table.js";
export type * from "./one_sql.order-table.js";
export type * from "./one_sql.order_item-table.js";
export * from "./one_sql-enums.js";

import postgres from "postgres";

import { newProduct } from "./one_sql.product-table.js";
import { newAccount } from "./one_sql.account-table.js";
import { newOrder } from "./one_sql.order-table.js";
import { newOrderItem } from "./one_sql.order_item-table.js";

export function newOneSqlSchema(sql: postgres.Sql) {
   return {
      Product: newProduct(sql),
      Account: newAccount(sql),
      Order: newOrder(sql),
      OrderItem: newOrderItem(sql),
   }
}