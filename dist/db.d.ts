import { Client } from "pg";
declare function getDbClient(dbUrl: string): Promise<Client>;
declare function runSqlFile(db: Client, filePath: string): Promise<import("pg").QueryResult<any>>;
export { getDbClient, runSqlFile };
