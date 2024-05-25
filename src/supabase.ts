import * as child from "child_process";
import { file, withFile } from "tmp-promise";
import { promises as fs } from "fs";
import path from "path";
import chalk from "chalk";

class ExecError extends Error {
    stdout?: string;
    stderr?: string;
    innerError?: Error;
}

function exec(
    command: string,
    options = { cwd: process.cwd() }
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((done, failed) => {
      child.exec(command, { ...options }, (err, stdout, stderr) => {
        if (err) {
          const e = new ExecError();
          e.stdout = stdout;
          e.stderr = stderr;
          e.innerError = err;
          e.message = `Command failed and exited with code ${err.code}`;
          failed(e);
          return;
        }
  
        done({ stdout, stderr });
      });
    });
  }

  interface CreateSupabaseMigrationArgs {
    name: string;
    files: string[];
    supabaseDatabaseName: string;
    supabaseDir: string;
    dryRun: boolean;
    log: (message?: any, ...optionalParams: any[]) => void;
  }