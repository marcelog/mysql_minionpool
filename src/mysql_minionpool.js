/**
 * Mysql minion pool.
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
var minionPoolMod = require('minionpool');
var util = require('util');
var mysql = require('mysql');

function MysqlMinionPool(options) {
  var self = this;
  options.mysqlConfig.connectionLimit = options.concurrency;
  var mysqlPool = mysql.createPool(options.mysqlConfig);
  var superTaskSourceStart = this.dummyTaskSourceStart;
  var superMinionStart = this.dummyMinionStart;
  var superMinionEnd = this.dummyMinionEnd;
  var superTaskSourceEnd = this.dummyTaskSourceEnd;
  var superTaskSourceNext = options.taskSourceNext;
  var superPoolEnd = options.poolEnd;
  var superMinionTaskHandler = options.minionTaskHandler;

  if(options.taskSourceStart !== undefined) {
    superTaskSourceStart = options.taskSourceStart;
  }
  if(options.taskSourceEnd !== undefined) {
    superTaskSourceEnd = options.taskSourceEnd;
  }
  if(options.minionStart !== undefined) {
    superMinionStart = options.minionStart;
  }
  if(options.minionEnd !== undefined) {
    superMinionEnd = options.minionEnd;
  }

  options.minionStart = function(callback) {
    superMinionStart(function(state) {
      state.mysqlPool = mysqlPool;
      callback(state);
    });
  };
  options.minionEnd = function(state, callback) {
    superMinionEnd(state, callback);
  };    
  options.poolEnd = function() {
    superPoolEnd();
  };    
  options.taskSourceEnd = function(state, callback) {
    state.mysqlPool.end(function() {
      superTaskSourceEnd(state, callback);
    });
  }
  if(options.taskSourceStart !== undefined) {
    options.taskSourceStart = function(callback) {
      superTaskSourceStart(function(state) {
        state.mysqlPool = mysqlPool;
        callback(state);
      });
    };
  }
  options.taskSourceNext = function(state, callback) {
    return superTaskSourceNext(state, callback);
  };
  options.minionTaskHandler = function(rows, state, callback) {
    var rowPool = new minionPoolMod.ArrayMinionPool({
      concurrency: options.rowConcurrency,
      debug: options.debug,
      logger: options.logger,
      name: options.name + ' row',
      minionTaskHandler: function(row, stateRow, callbackRow) {
        superMinionTaskHandler(row, state, callbackRow)
      },
      poolEnd: function() {
        console.log('done page');
        callback(state);
      }
    }, rows);
    rowPool.start();
  };
  MysqlMinionPool.super_.call(this, options);
};

util.inherits(MysqlMinionPool, minionPoolMod.MinionPool);

exports.MysqlMinionPool = MysqlMinionPool;
