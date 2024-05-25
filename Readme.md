<div id="top"></div>

<h3 align="center">sqlbase</h3>

  <p align="center">
    A small tool to improve the SQL developer experience in Supabase projects.
    <br />
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

<a href="https://supabase.com/">Supabase</a> is an extremely productive tool for quickly generating robust APIs atop SQL databases. Supabase offers several extension points, including writing SQL functions in languages like PL/SQL or PL/pgSQL.

The developer workflow for writing SQL code in a Supabase-managed codebase is lacking. The default workflow does not require SQL code to be checked into an application's source tree like any other code. This can lead to error-prone manual workflows like copy/pasting existing functions into new migrations. Reviewing such migrations is nearly impossible.

sqlbase offers an opinionated workflow wherein SQL functions are checked into a source tree as `.sql` files. While iterating on SQL code, sqlbase will monitor for changed files and automatically apply them to a Postgres database. When it comes time to write out a  migration, sqlbase will gather files modified `.sql` files (according to git) and generate a new Supabase migration with them.

<!-- GETTING STARTED -->

## Getting Started

```sh
$ npm install -g sqlbase
$ sqlbase watch --path path/to/sql/files --db postgres://...
-> Monitoring changes to path/to/sql/files/**/*.sql

# Add/edit some SQL code and it will be applied to the DB automatically.

-> Applying file path/to/sql/files/new_sql_function.sql
-> File applied.

# Ctrl-C to exit

$ git status
...
    added: path/to/sql/files/new_sql_function.sql

$ sqlbase migrate \
    --name add_new_sql_function \
    --path path/to/sql/files \
    --supabase-dir path/to/Supabase/files
-> Generating migration: add_new_sql_function
...
-> supabase migrate completed
```

<!-- USAGE EXAMPLES -->

## Usage

```
Usage: sqlbase <command> [options]

Commands:
  index.ts watch    Watch and apply changes in SQL files            [aliases: w]
  index.ts migrate  Generate Supabase migrations for changed SQL files[aliases: m]
  index.ts import   Import a SQL function into a file               [aliases: i]

Options:
      --help     Show help                                             [boolean]
      --version  Show version number                                   [boolean]
  -p, --path     The path containing .sql files          [string] [default: "."]
      --dry-run  Print commands that would run; don't actually run
                                                      [boolean] [default: false]
```

```
sqlbase watch

Watch and apply changes in SQL files

Options:
      --help     Show help                                             [boolean]
      --version  Show version number                                   [boolean]
  -p, --path     The path containing .sql files          [string] [default: "."]
      --dry-run  Print commands that would run; don't actually run
                                                      [boolean] [default: false]
      --db       DSN-style URL to access Postgres DB
```

```
sqlbase migrate

Generate Supabase migrations for changed SQL files

Options:
      --help                  Show help                                [boolean]
      --version               Show version number                      [boolean]
  -p, --path                  The path containing .sql files
                                                         [string] [default: "."]
      --dry-run               Print commands that would run; don't actually run
                                                      [boolean] [default: false]
      --name                  Name for the Supabase migration
                                                     [string] [default: "sqlbase"]
      --Supabase-dir            Path to Supabase schema directory           [string]
      --Supabase-database-name  Argument to --database-name
                                                   [string] [default: "default"]
      --diff-base             The git commit to diff against to find changed
                              .sql files              [string] [default: "HEAD"]
```

```
sqrl import

Import a SQL function into a file

Options:
      --help           Show help                                       [boolean]
      --version        Show version number                             [boolean]
  -p, --path           The path containing .sql files    [string] [default: "."]
      --dry-run        Print commands that would run; don't actually run
                                                      [boolean] [default: false]
      --db             DSN-style URL to access Postgres DB
      --function-name  SQL function to import to file
      --out            Relative path to output file
```

<!-- CONTRIBUTING -->

## Contributing

If you find sqlbase useful and would like to contribute improvements to it, please open a pull request!

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

