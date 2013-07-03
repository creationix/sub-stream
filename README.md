sub-stream
==========

A simple-stream pull-filter for converting flat streams into nested streams.

## subStream(stream, isHandle, propName) -> stream

Input is a flat stream that looks like `header`, `chunk`, `chunk`, ..., `header`, ...

In other words, you get header events followed by zero of more body chunks.

The output is a nested stream of `headerWithSubStream`, `headerWithSubStream`, ...

It's much easier to write filters that output flat streams than nested streams, especially when using the [push-to-pull][] helper.

```js
var subStream = require('sub-stream');
var pushToPull = require('push-to-pull');

// This is a madeup stream that emits 0 to 9 and then ends.
var stream = count(10);

// A filter that takes in a number and then outputs {size:n} followed by n monkeys.
var filter = pushToPull(function (emit) {
  return function (err, num) {
    // Forward end and error events through
    if (num === undefined) return emit(err);
    // Emit the flat stream events
    emit(null, {size: num});
    for (var i = 0; i < num; i++) {
      emit(null, "Monkey " + i);
    }
  };
});


// Create a nested stream using count, filter, and subStream.
stream = subStream(filter(count(5)), function (item) {
  return typeof item === "object";
}, "monkeys");


// Consume the nested stream
consume(stream, function (item) {
  console.log(item);
  consume(item.monkeys, console.log)(console.log);
})(console.log);
```


[push-to-pull]: https://github.com/creationix/push-to-pull