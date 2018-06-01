//. stats.js
var mysql = require( 'mysql' );
var settings = require( './settings' );

var connection = mysql.createConnection({
  host: settings.mysql_hostname,
  user: settings.mysql_username,
  password: settings.mysql_password,
  database: settings.mysql_dbname
});
connection.connect();

var member_id = 0;
if( process.argv.length > 2 ){
  member_id = parseInt( process.argv[2] );
}

if( member_id ){
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
                        console.log( 'member_id = ' + member_id );
                        console.log( strike_challenge_flames );
                        console.log( spare_challenge_flames );
                        console.log( strike_flames );
                        console.log( spare_flames );
                        console.log( open_flames );
                        console.log( split_flames );
                        console.log( split_cover_flames );
                        console.log( leave_right_flames );
                        console.log( leave_left_flames );

                        connection.end();
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
  console.log( 'Usage: node stats <member_id>' );
}

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
