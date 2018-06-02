//. app.js

var express = require( 'express' ),
    cfenv = require( 'cfenv' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    ejs = require( 'ejs' ),
    fs = require( 'fs' ),
    mysql = require( 'mysql' ),
    request = require( 'request' ),
    app = express();
var settings = require( './settings' );
var appEnv = cfenv.getAppEnv();

app.use( bodyParser.urlencoded( { extended: true, limit: '10mb' } ) );
app.use( bodyParser.json( { limit: '10mb' } ) );
app.use( express.static( __dirname + '/public' ) );

var port = appEnv.port || 3000;

var connection = mysql.createConnection({
  host: settings.mysql_hostname,
  user: settings.mysql_username,
  password: settings.mysql_password,
  database: settings.mysql_dbname
});
connection.connect();

app.get( '/members', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );
  connection.query( 'SELECT id,name,ruby,hand,img from members order by id', function( error, results, fields ){
    if( error ){
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: error }, 2, null ) );
      res.end();
    }else{
      res.write( JSON.stringify( { status: true, results: results, fields: fields }, 2, null ) );
      res.end();
    }
  });
});

app.get( '/games', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );
  var season = req.query.season;
  var number = req.query.number;
  var stage = req.query.stage;
  var block = req.query.block;
  var member_id = req.query.member_id;

  var where = '';
  var params = [];
  if( member_id ){
    if( where ){
      where += ' and';
    }
    where = ' id in ( select game_id from game_scores where member_id = ? )';
    params.push( member_id );
  }
  if( season ){
    if( where ){
      where += ' and';
    }
    where += ' season = ?';
    params.push( season );
  }
  if( number ){
    if( where ){
      where += ' and';
    }
    where += ' number = ?';
    params.push( number );
  }
  if( stage ){
    if( where ){
      where += ' and';
    }
    where += ' stage = ?';
    params.push( stage );
  }
  if( block ){
    if( where ){
      where += ' and';
    }
    where += ' block = ?';
    params.push( block );
  }
  if( where ){
    where = ' where' + where;
  }

  var sql = 'SELECT id,season,number,stage,block from games';
  sql += where;
  sql += ' order by id';
  connection.query( sql, params, function( error, results, fields ){
    if( error ){
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: error }, 2, null ) );
      res.end();
    }else{
      res.write( JSON.stringify( { status: true, results: results, fields: fields }, 2, null ) );
      res.end();
    }
  });
});

app.get( '/game_scores', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );
  var game_id = req.query.game_id;
  var member_id = req.query.member_id;

  var where = '';
  var params = [];
  if( game_id ){
    if( where ){
      where += ' and';
    }
    where += ' game_id = ?';
    params.push( game_id );
  }
  if( member_id ){
    if( where ){
      where += ' and';
    }
    where += ' member_id = ?';
    params.push( member_id );
  }
  if( where ){
    where = ' where' + where;
  }

  var sql = 'SELECT id,game_id,member_id,start_lane,protector,score,rank from game_scores';
  sql += where;
  sql += ' order by game_id,member_id';
  connection.query( sql, params, function( error, results, fields ){
    if( error ){
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: error }, 2, null ) );
      res.end();
    }else{
      res.write( JSON.stringify( { status: true, results: results, fields: fields }, 2, null ) );
      res.end();
    }
  });
});

app.get( '/flame_scores', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );
  var game_id = req.query.game_id;
  var member_id = req.query.member_id;
  var flame = req.query.flame;
  var s_throw = req.query.throw;

  var where = '';
  var params = [];
  if( game_id ){
    if( where ){
      where += ' and';
    }
    where += ' game_id = ?';
    params.push( game_id );
  }
  if( member_id ){
    if( where ){
      where += ' and';
    }
    where += ' member_id = ?';
    params.push( member_id );
  }
  if( flame ){
    if( where ){
      where += ' and';
    }
    where += ' flame = ?';
    params.push( flame );
  }
  if( s_throw ){
    if( where ){
      where += ' and';
    }
    where += ' throw = ?';
    params.push( s_throw );
  }
  if( where ){
    where = ' where' + where;
  }

  var sql = 'SELECT id,game_id,member_id,flame,throw,score,split,pins from flame_scores';
  sql += where;
  sql += ' order by game_id,member_id,flame';
  connection.query( sql, params, function( error, results, fields ){
    if( error ){
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: error }, 2, null ) );
      res.end();
    }else{
      res.write( JSON.stringify( { status: true, results: results, fields: fields }, 2, null ) );
      res.end();
    }
  });
});

app.get( '/svg', function( req, res ){
  var pins1 = req.query.pins1;
  var pins2 = req.query.pins2;
  if( pins1 ){
    res.contentType( 'image/svg+xml' );
    var svg = toSVG( pins1, pins2 );
    //console.log( svg );
    res.write( svg );
    res.end();
  }else{
    res.contentType( 'application/json' );
    res.write( JSON.stringify( { status: false, error: "Missing required parameter: pins" }, 2, null ) );
    res.end();
  }
});

app.get( '/strike.svg', function( req, res ){
  res.contentType( 'image/svg+xml' );
  var svg = strikeSVG();
  res.write( svg );
  res.end();
});

app.get( '/spare.svg', function( req, res ){
  res.contentType( 'image/svg+xml' );
  var svg = spareSVG();
  res.write( svg );
  res.end();
});

app.get( '/stats', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );
  var member_id = req.query.member_id;

  if( member_id ){
    //. ゲームスコアと一投目のピンカウント平均, 分散, 標準偏差
    var score0 = [], scoreR = [], scoreL = [];
    var avg_score = [ 0.0, 0.0, 0.0 ];
    var va_score = [ 0.0, 0.0, 0.0 ];
    var stdev_score = [ 0.0, 0.0, 0.0 ];
    var pins0 = [], pinsL = [], pinsL = [];
    var avg_pins = [ 0.0, 0.0, 0.0 ];
    var va_pins = [ 0.0, 0.0, 0.0 ];
    var stdev_pins = [ 0.0, 0.0, 0.0 ];

    //. ストライクを狙うフレーム数とスペアを狙うフレーム数を計算 [ 全体, 右, 左 ]
    var strike_challenge_flames = [ 0, 0, 0 ];
    var spare_challenge_flames = [ 0, 0, 0 ];

    //. ストライクフレーム数とスペアフレーム数を計算 [ 全体, 右, 左 ]
    var strike_flames = [ 0, 0, 0 ];
    var spare_flames = [ 0, 0, 0 ];

    //. オープンフレーム数、スプリットフレーム数、スプリットカバーフレーム数を計算 [ 全体, 右, 左 ]
    var open_flames = [ 0, 0, 0 ];
    var split_flames = [ 0, 0, 0 ];
    var split_cover_flames = [ 0, 0, 0 ];

    //. 一投目で向かって右側だけに残したフレーム数と、左側だけに残したフレーム数を計算 [ 全体, 右, 左 ]
    var leave_right_flames = [ 0, 0, 0 ];
    var leave_left_flames = [ 0, 0, 0 ];

    //. 対象ゲーム
    var params1 = [ member_id ];
    var sql1 = 'SELECT id,season,number,stage,block from games';
    sql1 += ' where id in ( select game_id from game_scores where member_id = ? )';
    sql1 += ' order by id';
    connection.query( sql1, params1, function( error1, games, fields1 ){
      if( error1 ){
        console.log( 'error1' );
        console.log( error1 );
      }else{
        //console.log( 'games' );
        //console.log( games );
        var games_length = games.length;
        var games_count = 0;
        games.forEach( function( game ){
          var game_id = game.id;

          var params2 = [ game_id, member_id ];
          var sql2 = 'SELECT id,start_lane,protector,score,rank from game_scores';
          sql2 += ' where game_id = ? and member_id = ?';
          sql2 += ' order by id';
          connection.query( sql2, params2, function( error2, game_scores, fields2 ){
            if( error2 ){
              console.log( 'error2' );
              console.log( error2 );
            }else{
              //console.log( 'game_scores' );
              //console.log( game_scores );
              var game_scores_length = game_scores.length;
              var game_scores_count = 0;

              var score = game_scores[0].score;
              var start_lane = game_scores[0].start_lane;
              var startRight = ( start_lane == 'R' );

              score0[] = score;
              if( startRight ){
                scoreR[] = score;
              }else{
                scoreL[] = score;
              }

              var params3 = [ game_id, member_id ];
              var sql3 = 'SELECT id,flame,throw,score,split,pins from flame_scores';
              sql3 += ' where game_id = ? and member_id = ?';
              sql3 += ' order by flame,throw';
              connection.query( sql3, params3, function( error3, flame_scores, fields3 ){
                if( error3 ){
                  console.log( 'error3' );
                  console.log( error3 );
                }else{
                  //console.log( 'flame_scores' );
                  //console.log( flame_scores );
                  var flame_scores_length = flame_scores.length;
                  var flame_scores_count = 0;

                  var prev1_score = -1;
                  var prev1_split = -1;
                  var prev1_pins = -1;
                  var prev2_score = -1;
                  var prev2_split = -1;
                  var prev2_pins = -1;
                  flame_scores.forEach( function( flame_score ){
                    if( flame_score.throw == 1 ){
                      pins0[] = flame_score.score;
                      if( startRight ){
                        pinsR[] = flame_score.score;
                      }else{
                        pinsL[] = flame_score.score;
                      }

                      //. split_flames
                      if( flame_score.split ){
                        split_flames[0] ++;
                        if( startRight ){
                          if( flame_score.flame % 2 ){
                            split_flames[1] ++;
                          }else{
                            split_flames[2] ++;
                          }
                        }else{
                          if( flame_score.flame % 2 ){
                            split_flames[2] ++;
                          }else{
                            split_flames[1] ++;
                          }
                        }
                      }

                      //. strike_flames
                      if( flame_score.score == 10 ){
                        strike_flames[0] ++;
                        if( startRight ){
                          if( flame_score.flame % 2 ){
                            strike_flames[1] ++;
                          }else{
                            strike_flames[2] ++;
                          }
                        }else{
                          if( flame_score.flame % 2 ){
                            strike_flames[2] ++;
                          }else{
                            strike_flames[1] ++;
                          }
                        }
                      }else{
                        //. leave_right_flames, leave_left_flames
                        var leave_right = leaveRight( flame_score.pins );
                        if( leave_right ){
                          leave_right_flames[0] ++;
                          if( startRight ){
                            if( flame_score.flame % 2 ){
                              leave_right_flames[1] ++;
                            }else{
                              leave_right_flames[2] ++;
                            }
                          }else{
                            if( flame_score.flame % 2 ){
                              leave_right_flames[2] ++;
                            }else{
                              leave_right_flames[1] ++;
                            }
                          }
                        }
                        var leave_left = leaveLeft( flame_score.pins );
                        if( leave_left ){
                          leave_left_flames[0] ++;
                          if( startRight ){
                            if( flame_score.flame % 2 ){
                              leave_left_flames[1] ++;
                            }else{
                              leave_left_flames[2] ++;
                            }
                          }else{
                            if( flame_score.flame % 2 ){
                              leave_left_flames[2] ++;
                            }else{
                              leave_left_flames[1] ++;
                            }
                          }
                        }
                      }

                      //. strike_challenge_flames
                      strike_challenge_flames[0] ++;
                      if( startRight ){
                        if( flame_score.flame % 2 ){
                          strike_challenge_flames[1] ++;
                        }else{
                          strike_challenge_flames[2] ++;
                        }
                      }else{
                        if( flame_score.flame % 2 ){
                          strike_challenge_flames[2] ++;
                        }else{
                          strike_challenge_flames[1] ++;
                        }
                      }
                    }

                    if( flame_score.flame == 10 ){
                      //. strike_challenge_flames & spare_challenge_flames
                      if( flame_score.throw == 2 ){
                        //. split_flames
                        if( flame_score.split ){
                          split_flames[0] ++;
                          if( startRight ){
                            if( flame_score.flame % 2 ){
                              split_flames[1] ++;
                            }else{
                              split_flames[2] ++;
                            }
                          }else{
                            if( flame_score.flame % 2 ){
                              split_flames[2] ++;
                            }else{
                              split_flames[1] ++;
                            }
                          }
                        }

                        //. 10フレーム第二投
                        if( prev1_score == 10 ){
                          //. strike_flames
                          if( flame_score.score == 10 ){
                            strike_flames[0] ++;
                            if( startRight ){
                              if( flame_score.flame % 2 ){
                                strike_flames[1] ++;
                              }else{
                                strike_flames[2] ++;
                              }
                            }else{
                              if( flame_score.flame % 2 ){
                                strike_flames[2] ++;
                              }else{
                                strike_flames[1] ++;
                              }
                            }
                          }else{
                            //. leave_right_flames, leave_left_flames
                            var leave_right = leaveRight( flame_score.pins );
                            if( leave_right ){
                              leave_right_flames[0] ++;
                              if( startRight ){
                                if( flame_score.flame % 2 ){
                                  leave_right_flames[1] ++;
                                }else{
                                  leave_right_flames[2] ++;
                                }
                              }else{
                                if( flame_score.flame % 2 ){
                                  leave_right_flames[2] ++;
                                }else{
                                  leave_right_flames[1] ++;
                                }
                              }
                            }
                            var leave_left = leaveLeft( flame_score.pins );
                            if( leave_left ){
                              leave_left_flames[0] ++;
                              if( startRight ){
                                if( flame_score.flame % 2 ){
                                  leave_left_flames[1] ++;
                                }else{
                                  leave_left_flames[2] ++;
                                }
                              }else{
                                if( flame_score.flame % 2 ){
                                  leave_left_flames[2] ++;
                                }else{
                                  leave_left_flames[1] ++;
                                }
                              }
                            }
                          }

                          strike_challenge_flames[0] ++;
                          if( startRight ){
                            if( flame_score.flame % 2 ){
                              strike_challenge_flames[1] ++;
                            }else{
                              strike_challenge_flames[2] ++;
                            }
                          }else{
                            if( flame_score.flame % 2 ){
                              strike_challenge_flames[2] ++;
                            }else{
                              strike_challenge_flames[1] ++;
                            }
                          }
                        }else{
                          //. open_flames & split_cover_flames
                          //. spare_flames
                          if( prev1_score + flame_score.score == 10 ){
                            spare_flames[0] ++;
                            if( prev1_split ){
                              split_cover_flames[0] ++;
                            }
                            if( startRight ){
                              if( flame_score.flame % 2 ){
                                spare_flames[1] ++;
                                if( prev1_split ){
                                  split_cover_flames[1] ++;
                                }
                              }else{
                                spare_flames[2] ++;
                                if( prev1_split ){
                                  split_cover_flames[2] ++;
                                }
                              }
                            }else{
                              if( flame_score.flame % 2 ){
                                spare_flames[2] ++;
                                if( prev1_split ){
                                  split_cover_flames[2] ++;
                                }
                              }else{
                                spare_flames[1] ++;
                                if( prev1_split ){
                                  split_cover_flames[1] ++;
                                }
                              }
                            }
                          }else{
                            open_flames[0] ++;
                            if( startRight ){
                              if( flame_score.flame % 2 ){
                                open_flames[1] ++;
                              }else{
                                open_flames[2] ++;
                              }
                            }else{
                              if( flame_score.flame % 2 ){
                                open_flames[2] ++;
                              }else{
                                open_flames[1] ++;
                              }
                            }
                          }

                          spare_challenge_flames[0] ++;
                          if( startRight ){
                            if( flame_score.flame % 2 ){
                              spare_challenge_flames[1] ++;
                            }else{
                              spare_challenge_flames[2] ++;
                            }
                          }else{
                            if( flame_score.flame % 2 ){
                              spare_challenge_flames[2] ++;
                            }else{
                              spare_challenge_flames[1] ++;
                            }
                          }
                        }
                      }else if( flame_score.throw == 3 ){
                        //. split_flames
                        if( flame_score.split ){
                          split_flames[0] ++;
                          if( startRight ){
                            if( flame_score.flame % 2 ){
                              split_flames[1] ++;
                            }else{
                              split_flames[2] ++;
                            }
                          }else{
                            if( flame_score.flame % 2 ){
                              split_flames[2] ++;
                            }else{
                              split_flames[1] ++;
                            }
                          }
                        }

                        //. 10フレーム第三投
                        if( prev1_score == 10 || prev1_score + prev2_score == 10 ){
                          //. strike_flames
                          if( flame_score.score == 10 ){
                            strike_flames[0] ++;
                            if( startRight ){
                              if( flame_score.flame % 2 ){
                                strike_flames[1] ++;
                              }else{
                                strike_flames[2] ++;
                              }
                            }else{
                              if( flame_score.flame % 2 ){
                                strike_flames[2] ++;
                              }else{
                                strike_flames[1] ++;
                              }
                            }
                          }else{
                            //. leave_right_flames, leave_left_flames
                            var leave_right = leaveRight( flame_score.pins );
                            if( leave_right ){
                              leave_right_flames[0] ++;
                              if( startRight ){
                                if( flame_score.flame % 2 ){
                                  leave_right_flames[1] ++;
                                }else{
                                  leave_right_flames[2] ++;
                                }
                              }else{
                                if( flame_score.flame % 2 ){
                                  leave_right_flames[2] ++;
                                }else{
                                  leave_right_flames[1] ++;
                                }
                              }
                            }
                            var leave_left = leaveLeft( flame_score.pins );
                            if( leave_left ){
                              leave_left_flames[0] ++;
                              if( startRight ){
                                if( flame_score.flame % 2 ){
                                  leave_left_flames[1] ++;
                                }else{
                                  leave_left_flames[2] ++;
                                }
                              }else{
                                if( flame_score.flame % 2 ){
                                  leave_left_flames[2] ++;
                                }else{
                                  leave_left_flames[1] ++;
                                }
                              }
                            }
                          }

                          strike_challenge_flames[0] ++;
                          if( startRight ){
                            if( flame_score.flame % 2 ){
                              strike_challenge_flames[1] ++;
                            }else{
                              strike_challenge_flames[2] ++;
                            }
                          }else{
                            if( flame_score.flame % 2 ){
                              strike_challenge_flames[2] ++;
                            }else{
                              strike_challenge_flames[1] ++;
                            }
                          }
                        }else{
                          //. open_flames & split_cover_flames
                          //. spare_flames
                          if( prev1_score + flame_score.score == 10 ){
                            spare_flames[0] ++;
                            if( prev1_split ){
                              split_cover_flames[0] ++;
                            }
                            if( startRight ){
                              if( flame_score.flame % 2 ){
                                spare_flames[1] ++;
                                if( prev1_split ){
                                  split_cover_flames[1] ++;
                                }
                              }else{
                                spare_flames[2] ++;
                                if( prev1_split ){
                                  split_cover_flames[2] ++;
                                }
                              }
                            }else{
                              if( flame_score.flame % 2 ){
                                spare_flames[2] ++;
                                if( prev1_split ){
                                  split_cover_flames[2] ++;
                                }
                              }else{
                                spare_flames[1] ++;
                                if( prev1_split ){
                                  split_cover_flames[1] ++;
                                }
                              }
                            }
                          }else{
                            open_flames[0] ++;
                            if( startRight ){
                              if( flame_score.flame % 2 ){
                                open_flames[1] ++;
                              }else{
                                open_flames[2] ++;
                              }
                            }else{
                              if( flame_score.flame % 2 ){
                                open_flames[2] ++;
                              }else{
                                open_flames[1] ++;
                              }
                            }
                          }

                          spare_challenge_flames[0] ++;
                          if( startRight ){
                            if( flame_score.flame % 2 ){
                              spare_challenge_flames[1] ++;
                            }else{
                              spare_challenge_flames[2] ++;
                            }
                          }else{
                            if( flame_score.flame % 2 ){
                              spare_challenge_flames[2] ++;
                            }else{
                              spare_challenge_flames[1] ++;
                            }
                          }
                        }
                      }
                    }else{
                      if( flame_score.throw == 2 ){
                        //. open_flames, spare_flames, split_cover_flames
                        if( prev1_score + flame_score.score == 10 ){
                          spare_flames[0] ++;
                          if( prev1_split ){
                            split_cover_flames[0] ++;
                          }
                          if( startRight ){
                            if( flame_score.flame % 2 ){
                              spare_flames[1] ++;
                              if( prev1_split ){
                                split_cover_flames[1] ++;
                              }
                            }else{
                              spare_flames[2] ++;
                              if( prev1_split ){
                                split_cover_flames[2] ++;
                              }
                            }
                          }else{
                            if( flame_score.flame % 2 ){
                              spare_flames[2] ++;
                              if( prev1_split ){
                                split_cover_flames[2] ++;
                              }
                            }else{
                              spare_flames[1] ++;
                              if( prev1_split ){
                                split_cover_flames[1] ++;
                              }
                            }
                          }
                        }else{
                          open_flames[0] ++;
                          if( startRight ){
                            if( flame_score.flame % 2 ){
                              open_flames[1] ++;
                            }else{
                              open_flames[2] ++;
                            }
                          }else{
                            if( flame_score.flame % 2 ){
                              open_flames[2] ++;
                            }else{
                              open_flames[1] ++;
                            }
                          }
                        }

                        spare_challenge_flames[0] ++;
                        if( startRight ){
                          if( flame_score.flame % 2 ){
                            spare_challenge_flames[1] ++;
                          }else{
                            spare_challenge_flames[2] ++;
                          }
                        }else{
                          if( flame_score.flame % 2 ){
                            spare_challenge_flames[2] ++;
                          }else{
                            spare_challenge_flames[1] ++;
                          }
                        }
                      }
                    }

                    flame_scores_count ++;
                    if( flame_scores_count == flame_scores_length ){
                      game_scores_count ++;
                      if( game_scores_count == game_scores_length ){
                        games_count ++;
                        if( games_count == games_length ){
                          //. avg
                          if( score0.length > 0 ){
                            for( var i = 0; i < score0.length; i ++ ){
                              avg_score[0] += score0[i];
                            }
                            avg_score[0] /= score0.length;
                          }
                          if( scoreR.length > 0 ){
                            for( var i = 0; i < scoreR.length; i ++ ){
                              avg_score[1] += scoreR[i];
                            }
                            avg_score[1] /= scoreR.length;
                          }
                          if( scoreL.length > 0 ){
                            for( var i = 0; i < scoreL.length; i ++ ){
                              avg_score[2] += scoreL[i];
                            }
                            avg_score[2] /= scoreL.length;
                          }
                          if( pins0.length > 0 ){
                            for( var i = 0; i < pins0.length; i ++ ){
                              avg_pins[0] += pins0[i];
                            }
                            avg_pins[0] /= pins0.length;
                          }
                          if( pinsR.length > 0 ){
                            for( var i = 0; i < pinsR.length; i ++ ){
                              avg_pins[1] += pinsR[i];
                            }
                            avg_pins[1] /= pinsR.length;
                          }
                          if( pinsL.length > 0 ){
                            for( var i = 0; i < pinsL.length; i ++ ){
                              avg_pins[2] += pinsL[i];
                            }
                            avg_pins[2] /= pinsL.length;
                          }

                          //. va, stdev
                          if( score0.length > 0 ){
                            for( var i = 0; i < score0.length; i ++ ){
                              va_score[0] += ( () score0[i] - avg_score[0] ) * ( score0[i] - avg_score[0] ) );
                            }
                            va_score[0] /= score0.length;
                            stdev_score[0] = Math.sqrt( va_score[0] );
                          }
                          if( scoreR.length > 0 ){
                            for( var i = 0; i < scoreR.length; i ++ ){
                              va_score[1] += ( () scoreR[i] - avg_score[1] ) * ( scoreR[i] - avg_score[1] ) );
                            }
                            va_score[1] /= scoreR.length;
                            stdev_score[1] = Math.sqrt( va_score[1] );
                          }
                          if( scoreL.length > 0 ){
                            for( var i = 0; i < scoreL.length; i ++ ){
                              va_score[2] += ( () scoreL[i] - avg_score[2] ) * ( scoreL[i] - avg_score[2] ) );
                            }
                            va_score[2] /= scoreL.length;
                            stdev_score[2] = Math.sqrt( va_score[2] );
                          }
                          if( pins0.length > 0 ){
                            for( var i = 0; i < pins0.length; i ++ ){
                              va_pins[0] += ( () pins0[i] - avg_pins[0] ) * ( pins0[i] - avg_pins[0] ) );
                            }
                            va_pins[0] /= pins0.length;
                            stdev_pins[0] = Math.sqrt( va_pins[0] );
                          }
                          if( pinsR.length > 0 ){
                            for( var i = 0; i < pinsR.length; i ++ ){
                              va_pins[1] += ( () pinsR[i] - avg_pins[1] ) * ( pinsR[i] - avg_pins[1] ) );
                            }
                            va_pins[1] /= pinsR.length;
                            stdev_pins[1] = Math.sqrt( va_pins[1] );
                          }
                          if( pinsL.length > 0 ){
                            for( var i = 0; i < pinsL.length; i ++ ){
                              va_pins[2] += ( () pinsL[i] - avg_pins[2] ) * ( pinsL[i] - avg_pins[2] ) );
                            }
                            va_pins[2] /= pinsL.length;
                            stdev_pins[2] = Math.sqrt( va_pins[2] );
                          }

                          res.write( JSON.stringify( {
                            status: true,
                            score: score0,
                            scoreR: scoreR,
                            scoreL: scoreL,
                            pins: pins0,
                            pinsR: pinsR,
                            pinsL: pinsL,
                            avg_score: avg_score,
                            verb_score: verb_score,
                            stdev_score: stdev_score,
                            avg_pins: avg_pins,
                            verb_pins: verb_pins,
                            stdev_pins: stdev_pins,
                            strike_challenge_flames: strike_challenge_flames,
                            spare_challenge_flames: spare_challenge_flames,
                            strike_flames: strike_flames,
                            spare_flames: spare_flames,
                            open_flames: open_flames,
                            split_flames: split_flames,
                            split_cover_flames: split_cover_flames,
                            leave_right_flames: leave_right_flames,
                            leave_left_flames: leave_left_flames
                          }, 2, null ) );
                          res.end();
                        }
                      }
                    }

                    prev2_score = prev1_score;
                    prev2_split = prev1_split;
                    prev2_pins = prev1_pins;
                    prev1_score = flame_score.score;
                    prev1_split = flame_score.split;
                    prev1_pins = flame_score.pins;
                  });
                }
              });
            }
          });
        });
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'Parameter member_id required.' }, 2, null ) );
    res.end();
  }
});

app.listen( port );
console.log( "server starting on " + port + " ..." );

function i2a( i ){
  var a = [];

  if( i > -1 ){
    for( var n = 9; n >= 0; n -- ){
      var t = Math.pow( 2, n );
      if( i >= t ){
        a.unshift( 1 ); //. 倒したピンは 1
        i -= t;
      }else{
        a.unshift( 0 );
      }
    }
  }

  return a;
}

function isSplit( v ){
  var arr = null;
  if( Array.isArray( v ) ){
    arr = v;
  }else if( typeof( v ) == 'number' ){
    arr = i2a( v );
  }

  var b = false;
  if( Array.isArray( arr ) && arr[0] == 1 ){ //. ①１番ピンが倒れている
    var row = [];
    row[0] = ( arr[6] == 0 ? 1 : 0 );
    row[1] = ( arr[3] == 0 ? 1 : 0 );
    row[2] = ( arr[1] == 0 || arr[7] == 0 ? 1 : 0 );
    row[3] = ( arr[4] == 0 ? 1 : 0 );
    row[4] = ( arr[2] == 0 || arr[8] == 0 ? 1 : 0 );
    row[5] = ( arr[5] == 0 ? 1 : 0 );
    row[6] = ( arr[9] == 0 ? 1 : 0 );

    //. ②row の中に不連続な 1 が存在している
    var cnt = 0;
    for( var n = 0; n < 6; n ++ ){
      if( row[n] + row[n+1] === 1 ){
        cnt ++;
      }
    }

    b = ( cnt > 1 );
  }

  return b;
}

function toSVG( v1, v2 ){
  var arr1 = null, arr2 = null;
  if( Array.isArray( v1 ) ){
    arr1 = v1;
  }else if( typeof( v1 ) == 'number' ){
    arr1 = i2a( v1 );
  }else if( typeof( v1 ) == 'string' ){
    arr1 = i2a( parseInt( v1 ) );
  }
  if( Array.isArray( v2 ) ){
    arr2 = v2;
  }else if( typeof( v2 ) == 'number' ){
    arr2 = i2a( v2 );
  }else if( typeof( v2 ) == 'string' ){
    arr2 = i2a( parseInt( v2 ) );
  }

  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">';
  if( Array.isArray( arr1 ) && arr1.length == 10 ){
    svg += '<g font-size="20">';
/*
    svg += '<text x="30" y="80">' + ( arr1[0] == 1 ? '○' : '①' ) + '</text>';
    svg += '<text x="20" y="60">' + ( arr1[1] == 1 ? '○' : '②' ) + '</text>';
    svg += '<text x="40" y="60">' + ( arr1[2] == 1 ? '○' : '③' ) + '</text>';
    svg += '<text x="10" y="40">' + ( arr1[3] == 1 ? '○' : '④' ) + '</text>';
    svg += '<text x="30" y="40">' + ( arr1[4] == 1 ? '○' : '⑤' ) + '</text>';
    svg += '<text x="50" y="40">' + ( arr1[5] == 1 ? '○' : '⑥' ) + '</text>';
    svg += '<text x="0" y="20">' + ( arr1[6] == 1 ? '○' : '⑦' ) + '</text>';
    svg += '<text x="20" y="20">' + ( arr1[7] == 1 ? '○' : '⑧' ) + '</text>';
    svg += '<text x="40" y="20">' + ( arr1[8] == 1 ? '○' : '⑨' ) + '</text>';
    svg += '<text x="60" y="20">' + ( arr1[9] == 1 ? '○' : '⑩' ) + '</text>';
*/
    svg += '<text x="30" y="78">' + ( arr1[0] == 1 ? '○' : '①' ) + '</text>';
    svg += '<text x="20" y="58">' + ( arr1[1] == 1 ? '○' : '②' ) + '</text>';
    svg += '<text x="40" y="58">' + ( arr1[2] == 1 ? '○' : '③' ) + '</text>';
    svg += '<text x="10" y="38">' + ( arr1[3] == 1 ? '○' : '④' ) + '</text>';
    svg += '<text x="30" y="38">' + ( arr1[4] == 1 ? '○' : '⑤' ) + '</text>';
    svg += '<text x="50" y="38">' + ( arr1[5] == 1 ? '○' : '⑥' ) + '</text>';
    svg += '<text x="0" y="18">' + ( arr1[6] == 1 ? '○' : '⑦' ) + '</text>';
    svg += '<text x="20" y="18">' + ( arr1[7] == 1 ? '○' : '⑧' ) + '</text>';
    svg += '<text x="40" y="18">' + ( arr1[8] == 1 ? '○' : '⑨' ) + '</text>';
    svg += '<text x="60" y="18">' + ( arr1[9] == 1 ? '○' : '⑩' ) + '</text>';
    svg += '</g>';

    if( Array.isArray( arr2 ) && arr2.length == 10 ){
      if( arr2[0] == 1 ){ svg += '<line x1="30" y1="80" x2="50" y2="60" stroke="#000000"/>'; }
      if( arr2[1] == 1 ){ svg += '<line x1="20" y1="60" x2="40" y2="40" stroke="#000000"/>'; }
      if( arr2[2] == 1 ){ svg += '<line x1="40" y1="60" x2="60" y2="40" stroke="#000000"/>'; }
      if( arr2[3] == 1 ){ svg += '<line x1="10" y1="40" x2="30" y2="20" stroke="#000000"/>'; }
      if( arr2[4] == 1 ){ svg += '<line x1="30" y1="40" x2="50" y2="20" stroke="#000000"/>'; }
      if( arr2[5] == 1 ){ svg += '<line x1="50" y1="40" x2="70" y2="20" stroke="#000000"/>'; }
      if( arr2[6] == 1 ){ svg += '<line x1="0" y1="20" x2="20" y2="0" stroke="#000000"/>'; }
      if( arr2[7] == 1 ){ svg += '<line x1="20" y1="20" x2="40" y2="0" stroke="#000000"/>'; }
      if( arr2[8] == 1 ){ svg += '<line x1="40" y1="20" x2="60" y2="0" stroke="#000000"/>'; }
      if( arr2[9] == 1 ){ svg += '<line x1="60" y1="20" x2="80" y2="0" stroke="#000000"/>'; }
    }
  }
  svg += '</svg>';

  return svg;
}

function strikeSVG(){
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15">';
  svg += '<path d="M0 0 L8 8 L0 15 Z" style="fill:black"/>';
  svg += '<path d="M8 8 L15 15 L15 0 Z" style="fill:black"/>';
  svg += '</svg>';

  return svg;
}

function spareSVG(){
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15">';
  svg += '<path d="M0 15 L15 15 L15 0 Z" style="fill:black"/>';
  svg += '</svg>';

  return svg;
}

function leaveRight( pins ){
  //. 3, 6, 9, 10 のみ残す
  var arr = i2a( pins );
  var b = ( arr[0] == 1
    && arr[1] == 1
    && arr[3] == 1
    && arr[4] == 1
    && arr[6] == 1
    && arr[7] == 1
    && ( arr[2] == 0 || arr[5] == 0 || arr[8] == 0 || arr[9] == 0 ) );

  return b;
}

function leaveLeft( pins ){
  //. 2, 4, 7, 8 のみ残す
  var arr = i2a( pins );
  var b = ( arr[0] == 1
    && arr[2] == 1
    && arr[4] == 1
    && arr[5] == 1
    && arr[8] == 1
    && arr[9] == 1
    && ( arr[1] == 0 || arr[3] == 0 || arr[6] == 0 || arr[7] == 0 ) );

  return b;
}
