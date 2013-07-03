
module.exports = function (stream, isHeader, prop) {
  if (!prop) prop = "stream";
  return { read: read, abort: stream.abort };
  
  function read(callback) {
    callback(new Error("TODO: Implement nested streams"));
  }

};