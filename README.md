# Gator CLI

Gator is a hungry RSS feed aggregator built in Typescript. It fetches your favorite blogs, parses their content, and stores everything in a PostgreSQL database so you can read the latest updates directly from your terminal.

## Prerequisites

To run this program, you'll need the following installed:
- npm, pnpm or bun
- PostgreSQL (running locally)

## Setup

1. Create a database in Postgres named "gator".
2. Create a configuration file in your home directory named `.gatorconfig.json`.
3. Add your database URL and current username to the file:

```
{
  "db_url": "postgres://username:password@localhost:5432/gator?sslmode=disable",
  "current_user_name": "your_name"
}
```

## How to Run

Since the project is in active development, you can run all commands using the Go CLI from the root of the project:

`pnpm run start <command> <arguments>`

## Essential Commands

Register your user:
`pnpm run start register your_name`

Add a new feed to the database:
`pnpm run start addfeed "Go Blog" https://go.dev/blog/index.xml`

Start the aggregator (this runs in a long-running loop):
`pnpm run start agg 1m`

In a separate terminal, browse the latest posts from the feeds you follow:
`pnpm run start browse 5`

To stop the aggregator or any running command, simply use Ctrl+C.