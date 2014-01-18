/**
 * Main ancestor for most of the classes.
 * 
 * Copyright 2014 Marcelo Gornstein &lt;marcelog@@gmail.com&gt;
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * copyright Marcelo Gornstein <marcelog@gmail.com>
 * author Marcelo Gornstein <marcelog@gmail.com>
 */
var mysqlMinionPoolMod = require('../src/mysql_minionpool');
var util = require('util');

var pool = new mysqlMinionPoolMod.MysqlMinionPool({
  mysqlConfig: {
    host: '127.0.0.1',
    user: 'root',
    password: 'pass',
    database: 'db',
    port: 3306
  },
  concurrency: 5,    // How many pages to get concurrently...
  rowConcurrency: 1, // ... and how many concurrent rows processed PER PAGE
  debug: true,
  name: "test",
  logger: console.log,

  taskSourceStart: function(callback) {
    callback({page: 0, pageSize: 5});
  },
  taskSourceNext: function(state, callback) {
    var db = 'db';
    var table = 'table';
    var query = "SELECT * FROM `" + db + "`.`" + table + "` LIMIT ?,?";
    state.mysqlPool.getConnection(function(err, mysqlConnection) {
      mysqlConnection.query(
        query, [state.page * state.pageSize, state.pageSize], function(err, rows) {
          mysqlConnection.release();
          if(err) throw err;
          if(rows.length === 0) {
            callback(undefined);
          } else {
            callback(rows);
          }
        }
      );
    });
    state.page++;
    return state;
  },
  poolEnd: function() {
    console.log('done');
  },
  minionTaskHandler: function(task, state, callback) {
    console.log('item: ' + util.inspect(task));
    callback(state);
  }
});
pool.start();
