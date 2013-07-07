
module.exports = function (stream, isHeader, prop) {
  var emit = null;
  var sub = false;
  var data = null;
  if (!prop) prop = "stream";
  
  return { read: read, abort: stream.abort };
  
  function read(callback) {
    if (data) {
      var args = data;
      data = null;
      callback.apply(null, args);
      return;
    }
    if (emit) return callback(new Error("Only one read allowed at a time"));
    emit = callback;
    if (!sub) stream.read(onRead);
  }
  
  function onRead(err, item) {
    var callback = emit;
    emit = null;
    if (item === undefined) {
      data = [err];
    }
    else if (isHeader(item)) {
      item[prop] = create();
      data = [null, item];
    }
    else {
      data = [new Error("Found non-header outside substream")];
    }
    if (callback) {
      var args = data;
      data = null;
      callback.apply(null, args);
    }
  }
  
  function create() {
    var subEmit = null;
    var done = false;
    sub = true;
    
    return { read: subRead, abort: stream.abort };
    function subRead(callback) {
      if (done) return callback(new Error("SubStream is already done"));
      if (subEmit) return callback(new Error("Only one read allowed at a time"));
      subEmit = callback;
      stream.read(onSubRead);
    }
    
    function onSubRead(err, item) {
      var callback = subEmit;
      subEmit = null;
      if (item === undefined || isHeader(item)) {
        done = true;
        sub = false;
        callback(err);
        return onRead(err, item);
      }
      callback(null, item);
    }
  }

};
