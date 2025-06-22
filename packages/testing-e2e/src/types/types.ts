import { IAccountSelect } from "../codegen/one_sql.account-table.js";
import { IOrderJson } from "../codegen/one_sql.order-table.js";

export interface AccountWithOrders extends IAccountSelect {
   orders: Pick<IOrderJson, "orderId" | "createdAt" | "status" | "accountId">[];
}
