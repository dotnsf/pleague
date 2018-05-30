//. i2a.js
for( var idx = 0; idx < process.argv.length; idx ++ ){
  console.log( "argv[" + idx + "] = " + process.argv[idx] );
}

var i = 923;
if( process.argv.length > 2 ){
  i = parseInt( process.argv[2] );
}
var a = i2a( i );
var s = isSplit( i );
var svg = toSVG( i );

console.log( i );
console.log( a );
if( s ){
  console.log( 'split' );
}
console.log( svg );

function i2a( i ){
  var a = [];

  for( var n = 9; n >= 0; n -- ){
    var t = Math.pow( 2, n );
    if( i >= t ){
      a.unshift( 1 );
      i -= t;
    }else{
      a.unshift( 0 );
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

function toSVG( v ){
  var arr = null;
  if( Array.isArray( v ) ){
    arr = v;
  }else if( typeof( v ) == 'number' ){
    arr = i2a( v );
  }

  var svg = false;
  if( Array.isArray( arr ) && arr.length == 10 ){
    svg = '<svg viewBox="0 0 40 40">';
    svg += '<g font-size="10">';

    svg += '<text x="15" y="40">' + ( arr[0] == 1 ? '○' : '①' ) + '</text>';
    svg += '<text x="10" y="30">' + ( arr[1] == 1 ? '○' : '②' ) + '</text>';
    svg += '<text x="20" y="30">' + ( arr[2] == 1 ? '○' : '③' ) + '</text>';
    svg += '<text x="5" y="20">' + ( arr[3] == 1 ? '○' : '④' ) + '</text>';
    svg += '<text x="15" y="20">' + ( arr[4] == 1 ? '○' : '⑤' ) + '</text>';
    svg += '<text x="25" y="20">' + ( arr[5] == 1 ? '○' : '⑥' ) + '</text>';
    svg += '<text x="0" y="10">' + ( arr[6] == 1 ? '○' : '⑦' ) + '</text>';
    svg += '<text x="10" y="10">' + ( arr[7] == 1 ? '○' : '⑧' ) + '</text>';
    svg += '<text x="20" y="10">' + ( arr[8] == 1 ? '○' : '⑨' ) + '</text>';
    svg += '<text x="30" y="10">' + ( arr[9] == 1 ? '○' : '⑩' ) + '</text>';

    svg += '</g></svg>';
  }

  return svg;
}


