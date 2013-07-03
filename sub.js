
module.exports = function (stream, isHeader, prop) {
  if (!prop) prop = "stream";

  var reading = false;
  var callback = null;
  var sub = null;
  
  return { read: read, abort: stream.abort };
  
  function read(cb) {
    if (callback) return cb(new Error("Only one read at a time"));
    callback = cb;
    check();
  }
  
  function check() {
    if (!reading && callback) {
      reading = true;
      stream.read(onRead); 
    }
  }
  
  function onRead(err, item) {
    reading = false;
    // End events end the current substream and the main stream.
    if (item === undefined) {
      if (sub) sub.emit(err);
      while (readQueue.length) {
        readQueue.shift()(err);
      }
      done = true;
      return;
    }
    
    // Normal events are checked by the user function
    if (isHeader(item)) {
      dataQueue.push([null, createSub(item)]);
    }
    else {
      subDataQueue.push([null, item]);
    }
    check();
  }
  
  function createSub(item) {
    var done = false;
    item[prop] = sub = { read: subRead, abort: subAbort };
    
    function subRead(callback) {
      if (done) return callback();
      subReadQueue.push(callback);
      check();
    }
    
    function flush() {
      if (subReader) subReader.apply(null, subDataQueue.shift());
    }
    
    function subAbort(callback) {
      flush();
      sub = null;
      done = true;
      callback();
    }
    
    return sub;
  }
};