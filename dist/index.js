#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const yargs_1 = __importDefault(require("yargs"));
const fs_1 = require("fs");
const db_1 = require("./db");
const repo_1 = require("./repo");
const watch_1 = require("./watch");
process.on('unhandledRejection', (error) => {
    console.error(error);
    process.exit(1);
});
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    yield yargs_1.default
        .usage("Usage: $0 <command> [options]")
        .example("$0 watch --path sql/ --db postgres://postgres:postgres@localhost/db", "watch SQL files in sql/ and run modified files against the specified DB")
        .option("path", {
        alias: "p",
        describe: "The path containing .sql files",
        type: "string",
        default: ".",
    })
        .option("dry-run", {
        describe: "Print commands that would run; don't actually run",
        type: "boolean",
        default: false,
    })
        .command({
        command: "watch",
        aliases: ["w"],
        describe: "Watch and apply changes in SQL files",
        builder: (yargs) => {
            return yargs.option("db", {
                describe: "DSN-style URL to access Postgres DB",
            });
        },
        handler: (argv) => __awaiter(void 0, void 0, void 0, function* () {
            yield runWatch({
                dbUrl: argv["db"],
                sourcePath: argv.path,
                dryRun: argv["dry-run"],
            });
        }),
    })
        .command({
        command: "lint",
        aliases: ["l"],
        describe: "Verify that changed .sql files appear in hasura migrations",
        builder: (yargs) => {
            return yargs
                .option("hasura-dir", {
                describe: "Path to hasura schema directory",
                type: "string",
            })
                .option("diff-base", {
                describe: "The git commit to diff against to find changed .sql files",
                default: "HEAD",
                type: "string",
            });
        },
        handler: (argv) => __awaiter(void 0, void 0, void 0, function* () {
            yield runLint({
                name: argv.name,
                sourcePath: argv.path,
                hasuraDir: argv["hasura-dir"],
                diffBase: argv["diff-base"],
            });
        }),
    })
        .demandCommand()
        .parseAsync();
});
const runWatch = ({ dbUrl, sourcePath, dryRun }) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, db_1.getDbClient)(dbUrl);
    (0, watch_1.watchPath)({
        sourcePath: sourcePath,
        log: console.log.bind(console),
        fileChanged: (filePath) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                if (dryRun) {
                    console.log(chalk_1.default.green("->"), `Running in dry run mode. Would apply ${filePath}`);
                }
                else {
                    console.log(chalk_1.default.green("->"), `Applying file ${filePath}`);
                    try {
                        yield (0, db_1.runSqlFile)(db, filePath);
                        console.log(chalk_1.default.green("->"), `File applied.`);
                    }
                    catch (e) {
                        const err = e;
                        console.log(chalk_1.default.red("->"), `Applying SQL file failed at position ${err.position}. Message:`);
                        console.log(err.message);
                    }
                }
            }
            catch (e) {
                console.error(e);
            }
        }),
    });
});
const runMigrate = ({ name, sourcePath, hasuraDir, hasuraDatabaseName, diffBase, dryRun, }) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(chalk_1.default.green("->"), `Generating migration: ${name}`);
    const changedFiles = yield (0, repo_1.getModifiedSqlFiles)(sourcePath, diffBase);
    if (!changedFiles.length) {
        console.log(chalk_1.default.green("->"), `No modified SQL files found. Exiting.`);
        return;
    }
    console.log(chalk_1.default.green("->"), `Found modified files:`);
    console.log(changedFiles);
    //   await createHasuraMigration({
    //     name: name,
    //     files: changedFiles,
    //     hasuraDir: hasuraDir,
    //     hasuraDatabaseName: hasuraDatabaseName,
    //     dryRun: dryRun,
    //     log: console.log.bind(console),
    //   });
});
const runImport = ({ dbUrl, functionName, sourcePath, outRelativePath, }) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(chalk_1.default.green("->"), `Importing function: ${functionName}`);
    const db = yield (0, db_1.getDbClient)(dbUrl);
    console.log(functionName);
    const functionTextResult = yield db.query("select pg_get_functiondef(oid) from pg_proc where proname = $1", [functionName]);
    if (!(functionTextResult &&
        functionTextResult.rows &&
        functionTextResult.rows[0])) {
        console.log(chalk_1.default.red("->"), `Function not found: ${functionName}`);
        throw new Error(`Function not found in DB: ${functionName}`);
    }
    console.log(chalk_1.default.green("->"), `Importing function: ${functionName}`);
    const functionText = functionTextResult.rows[0].pg_get_functiondef;
    const outpath = path_1.default.join(sourcePath, outRelativePath);
    const outStream = yield fs_1.promises.open(outpath, "w");
    outStream.writeFile(functionText);
    outStream.close();
    const numLines = functionText.split("\n").length;
    console.log(chalk_1.default.green("->"), `Wrote: ${numLines} lines to ${outpath}`);
    db.end();
});
const runLint = ({ name, sourcePath, hasuraDir, diffBase }) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(chalk_1.default.green("->"), `Linting changed files under ${sourcePath} against migrations in ${hasuraDir}`);
    const changedFiles = yield (0, repo_1.getModifiedSqlFiles)(sourcePath, diffBase);
    const migrationFiles = yield (0, repo_1.getMigrationFiles)(hasuraDir, diffBase);
    if (!changedFiles.length) {
        console.log(chalk_1.default.green("->"), `No modified SQL files found. Exiting.`);
        return;
    }
    console.log(chalk_1.default.green("->"), `Found modified files:`);
    console.log(changedFiles);
    console.log(chalk_1.default.green("->"), `Found migrations:`);
    console.log(migrationFiles);
    const migrationFileContents = yield Promise.all(migrationFiles.map((f) => fs_1.promises.readFile(f)));
    const allMigrationContent = migrationFileContents.reduce((res, buf) => res + buf.toString(), "");
    const missingMigrations = changedFiles.filter((f) => !allMigrationContent.includes(`-- ${path_1.default.basename(f)}`));
    if (missingMigrations.length) {
        console.log(chalk_1.default.red("->"), `Found modified files not referenced in migrations:`);
        console.log(missingMigrations);
        process.exitCode = 1;
    }
});
run();
