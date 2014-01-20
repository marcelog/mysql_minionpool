# About
Extends [minionpool](https://github.com/marcelog/minionpool) to have worker
pools that can process rows from a mysql table. It uses [node-mysql](https://github.com/felixge/node-mysql) as its MySQL driver.

## Installing it
The npm package is called **mysql_minionpool**.

## Using it
It's used as a standard [minionpool](https://github.com/marcelog/minionpool), you
only need to provide some of the callbacks and **mysql_minionpool** will do the 
rest (see below).

### Example
Here's a simple program that will use **mysql_minionpool** to process a whole
table paginating the rows, suitable to process a large number of rows.

```js
var pool = new mysqlMinionPoolMod.MysqlMinionPool({
  mysqlConfig: {
    host: '127.0.0.1',
    user: 'root',
    password: 'pass',
    database: 'db',
    port: 3306
  },
  concurrency: 5,    // How many pages to get concurrently...
  rowConcurrency: 1, // ... and how many concurrent rows processed PER query

  // Since we're paginating, let's create a state where we can store the
  // current page and the total rows per page.
  // First argument is the error, if something failed.
  taskSourceStart: function(callback) {
    callback(undefined, {page: 0, pageSize: 10});
  },

  // Called to retrieve rows to process (a page, in our case). In the 'state'
  // variable, there will be a property state.mysqlPool that grants mysql
  // access.
  taskSourceNext: function(state, callback) {
    var db = 'db';
    var table = 'table';
    var query = "SELECT * FROM `" + db + "`.`" + table + "` LIMIT ?,?";
    state.mysqlPool.getConnection(function(err, mysqlConnection) {
      mysqlConnection.query(
        query, [state.page * state.pageSize, state.pageSize], function(err, rows) {
          mysqlConnection.release();
          // First argument for the callback is the error, if something failed.
          if(err) {
            callback(err, undefined);
          } else if(rows.length === 0) {
            callback(undefined, undefined);
          } else {
            callback(undefined, rows);
          }
        }
      );
    });
    state.page++;
    return state;
  },

  // The handle also gets state.mysqlPool.
  minionTaskHandler: function(task, state, callback) {
    console.log('item: ' + util.inspect(task));
    // First argument is the error, if something failed.
    callback(undefined, state);
  },

  poolEnd: function() {
    console.log('done');
  },
});
pool.start();
```
