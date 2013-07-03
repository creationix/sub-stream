var subStream = require('./.');


function source(a, b) {
  var n = 0;
  return { read: read, abort: abort };
  function read(callback) {
    if (!a) return callback();
    var item = n ? n : {num : a};
    n = (n + 1) % b;
    if (!n) a--;
    process.nextTick(function () {
      callback(null, item);    
    });
  }
  function abort(callback) {
    a = 0;
    callback();
  }
}

// Consume a stream storing events in an array.
function consume(stream, onItem) {
  var callback;
  var sync;

  return function (cb) {
    callback = cb;
    start();
  };
  
  function start() {
    do {
      sync = undefined;
      stream.read(onRead);
      if (sync === undefined) sync = false;
    } while (sync);
  }
  
  function onRead(err, item) {
    if (item === undefined) return callback(err);
    onItem(item);
    if (sync === undefined) sync = true;
    else start();
  }
}

flat();

// Dump the original flat stream
function flat() {

  var stream = source(5, 4);
  console.log("Consuming flat stream");
  consume(stream, console.log)(function (err) {
    if (err) throw err;
    console.log("END");
    nested();
  });

}

function nested() {

  // Dump the nested stream
  var stream = subStream(source(5, 4), function (item) {
    return typeof item === "object";
  }, "stream");
  console.log("\nConsuming nested stream");
  consume(stream, function (item) {
    console.log(item);
    consume(item.stream, console.log.bind(console, "\t"))(function (err) {
      if (err) throw err;
      console.log("\t", "END");
    });
  })(function (err) {
    if (err) throw err;
    console.log("END");
  });

}

