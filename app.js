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

  var where = '';
  var params = [];
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

