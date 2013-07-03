
module.exports = function (stream, isHeader, prop) {
  var emit = null;
  var sub = false;
  if (!prop) prop = "stream";
  
  return { read: read, abort: stream.abort };
  
  function read(callback) {
    if (emit) return callback(new Error("Only one read allowed at a time"));
    emit = callback;
    if (!sub) stream.read(onRead);
  }
  
  function onRead(err, item) {
    var callback = emit;
    emit = null;
    if (item === undefined) {
      return callback(err);
    }
    if (isHeader(item)) {
      item[prop] = create();
      return callback(null, item);
    }
    callback(new Error("Found non-header outside substream"));
  }
  
  function create() {
    var subEmit = null;
    sub = true;
    
    return { read: subRead, abort: stream.abort };
    function subRead(callback) {
      if (subEmit) return callback(new Error("Only one read allowed at a time"));
      subEmit = callback;
      stream.read(onSubRead);
    }
    
    function onSubRead(err, item) {
      var callback = subEmit;
      subEmit = null;
      if (item === undefined || isHeader(item)) {
        sub = false;
        callback(err);
        return onRead(err, item);
      }
      callback(null, item);
    }
  }

};
