#!/usr/bin/env node
import chalk from "chalk";
import path from "path";
import yargs from "yargs";
import { promises as fs } from "fs";
import { getDbClient, runSqlFile } from "./db";
import { getMigrationFiles, getModifiedSqlFiles } from "./repo";
import { watchPath } from "./watch";

process.on('unhandledRejection', (error) => {
  console.error(error);
  process.exit(1);
});

const run = async () => {
  await yargs
    .usage("Usage: $0 <command> [options]")
    .example(
      "$0 watch --path sql/ --db postgres://postgres:postgres@localhost/db",
      "watch SQL files in sql/ and run modified files against the specified DB"
    )
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
      handler: async (argv) => {
        await runWatch({
          dbUrl: argv["db"] as string,
          sourcePath: argv.path as string,
          dryRun: argv["dry-run"] as boolean,
        });
      },
    })
    .command({
      command: "lint",
      aliases: ["l"],
      describe: "Verify that changed .sql files appear in supabase migrations",
      builder: (yargs) => {
        return yargs
          .option("supabase-dir", {
            describe: "Path to supabase schema directory",
            type: "string",
          })
          .option("diff-base", {
            describe:
              "The git commit to diff against to find changed .sql files",
            default: "HEAD",
            type: "string",
          });
      },
      handler: async (argv) => {
        await runLint({
          name: argv.name as string,
          sourcePath: argv.path as string,
          supabaseDir: argv["supabase-dir"] as string,
          diffBase: argv["diff-base"] as string,
        });
      },
    })
    .demandCommand()
    .parseAsync();
};

interface WatchArgs {
  dbUrl: string;
  sourcePath: string;
  dryRun: boolean;
}
const runWatch = async ({ dbUrl, sourcePath, dryRun }: WatchArgs) => {
  const db = await getDbClient(dbUrl);

  watchPath({
    sourcePath: sourcePath,
    log: console.log.bind(console),
    fileChanged: async (filePath: string) => {
      try {
        if (dryRun) {
          console.log(
            chalk.green("->"),
            `Running in dry run mode. Would apply ${filePath}`
          );
        } else {
          console.log(chalk.green("->"), `Applying file ${filePath}`);
          try {
            await runSqlFile(db, filePath);
            console.log(chalk.green("->"), `File applied.`);
          } catch (e) {
            const err: any = e;
            console.log(
              chalk.red("->"),
              `Applying SQL file failed at position ${err.position}. Message:`
            );
            console.log(err.message);
          }
        }
      } catch (e) {
        console.error(e);
      }
    },
  });
};

interface MigrateArgs {
  name: string;
  sourcePath: string;
  supabaseDir: string;
  supabaseDatabaseName: string;
  diffBase: string;
  dryRun: boolean;
}
const runMigrate = async ({
  name,
  sourcePath,
  supabaseDir,
  supabaseDatabaseName,
  diffBase,
  dryRun,
}: MigrateArgs) => {
  console.log(chalk.green("->"), `Generating migration: ${name}`);

  const changedFiles = await getModifiedSqlFiles(sourcePath, diffBase);
  if (!changedFiles.length) {
    console.log(chalk.green("->"), `No modified SQL files found. Exiting.`);
    return;
  }
  console.log(chalk.green("->"), `Found modified files:`);
  console.log(changedFiles);

//   await createsupabaseMigration({
//     name: name,
//     files: changedFiles,
//     supabaseDir: supabaseDir,
//     supabaseDatabaseName: supabaseDatabaseName,
//     dryRun: dryRun,
//     log: console.log.bind(console),
//   });
};

interface ImportArgs {
  dbUrl: string;
  functionName: string;
  sourcePath: string;
  outRelativePath: string;
}
const runImport = async ({
  dbUrl,
  functionName,
  sourcePath,
  outRelativePath,
}: ImportArgs) => {
  console.log(chalk.green("->"), `Importing function: ${functionName}`);

  const db = await getDbClient(dbUrl);
  console.log(functionName);
  const functionTextResult = await db.query(
    "select pg_get_functiondef(oid) from pg_proc where proname = $1",
    [functionName]
  );
  if (
    !(
      functionTextResult &&
      functionTextResult.rows &&
      functionTextResult.rows[0]
    )
  ) {
    console.log(chalk.red("->"), `Function not found: ${functionName}`);
    throw new Error(`Function not found in DB: ${functionName}`);
  }

  console.log(chalk.green("->"), `Importing function: ${functionName}`);
  const functionText = functionTextResult.rows[0].pg_get_functiondef;
  const outpath = path.join(sourcePath, outRelativePath);
  const outStream = await fs.open(outpath, "w");
  outStream.writeFile(functionText);
  outStream.close();

  const numLines = functionText.split("\n").length;
  console.log(chalk.green("->"), `Wrote: ${numLines} lines to ${outpath}`);
  db.end();
};

interface LintArgs {
  name: string;
  sourcePath: string;
  supabaseDir: string;
  diffBase: string;
}
const runLint = async ({ name, sourcePath, supabaseDir, diffBase }: LintArgs) => {
  console.log(
    chalk.green("->"),
    `Linting changed files under ${sourcePath} against migrations in ${supabaseDir}`
  );

  const changedFiles = await getModifiedSqlFiles(sourcePath, diffBase);
  const migrationFiles = await getMigrationFiles(supabaseDir, diffBase);

  if (!changedFiles.length) {
    console.log(chalk.green("->"), `No modified SQL files found. Exiting.`);
    return;
  }
  console.log(chalk.green("->"), `Found modified files:`);
  console.log(changedFiles);

  console.log(chalk.green("->"), `Found migrations:`);
  console.log(migrationFiles);

  const migrationFileContents = await Promise.all(
    migrationFiles.map((f) => fs.readFile(f))
  );
  const allMigrationContent = migrationFileContents.reduce(
    (res, buf) => res + buf.toString(),
    ""
  );

  const missingMigrations = changedFiles.filter(
    (f) => !allMigrationContent.includes(`-- ${path.basename(f)}`)
  );
  if (missingMigrations.length) {
    console.log(
      chalk.red("->"),
      `Found modified files not referenced in migrations:`
    );
    console.log(missingMigrations);
    process.exitCode = 1;
  }
};

run();
