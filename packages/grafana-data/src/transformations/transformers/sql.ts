import { map } from 'rxjs/operators';
import initSqlJs from 'sql.js';

import { DataFrame, DataTransformerInfo } from '../../types';

import { DataTransformerID } from './ids';

async function testSqlJs() {
  const SQL = await initSqlJs({
    // Required to load the wasm binary asynchronously. Of course, you can host it wherever you want
    // You can omit locateFile completely when running in node
    locateFile: file => `https://sql.js.org/dist/${file}`
  });

  // Create a database
  const db = new SQL.Database();
  // NOTE: You can also use new SQL.Database(data) where
  // data is an Uint8Array representing an SQLite database file


  // Execute a single SQL string that contains multiple statements
  let sqlstr = "CREATE TABLE hello (a int, b char); \
  INSERT INTO hello VALUES (0, 'hello'); \
  INSERT INTO hello VALUES (1, 'world');";
  db.run(sqlstr); // Run the query without returning anything

  // Prepare an sql statement
  const stmt = db.prepare("SELECT * FROM hello WHERE a=:aval AND b=:bval");

  // Bind values to the parameters and fetch the results of the query
  const result = stmt.getAsObject({ ':aval': 1, ':bval': 'world' });
  console.log(result); // Will print {a:1, b:'world'}

  // Bind other values
  stmt.bind([0, 'hello']);
  while (stmt.step()) console.log(stmt.get()); // Will print [0, 'hello']
  // free the memory used by the statement
  stmt.free();
  // You can not use your statement anymore once it has been freed.
  // But not freeing your statements causes memory leaks. You don't want that.

  const res = db.exec("SELECT * FROM hello");
  console.log({ res })
  /*
  [
    {columns:['a','b'], values:[[0,'hello'],[1,'world']]}
  ]
  */
}

export interface SqlOptions {
  queries: Array<{
    refId: string;
    sql: string;
  }>;
}

export const SqlTransformer: DataTransformerInfo<SqlOptions> = {
  id: DataTransformerID.sql,
  name: 'SQL',
  description: 'Use SQL to tranform your data.',
  defaultOptions: {
    query: '',
  },

  // operator: (options, ctx) => (source) => source.pipe(map((data) => SqlTransformer.transformer(options, ctx)(data))),
  operator: (options) => (source) => {
    return source.pipe(map((input) => {
      const output: DataFrame[] = options.queries.map(query => {
        return {
          refId: query.refId,
          name: query.refId,
          fields: [],
          length: 0
        }
      });

      return output;
    }))
  },
};
