+++
author = "Josh Wulf"
categories = ["javascript", "programming"]
date = "2017-11-20"
description = "return — basically the GOTO statement of 2017"
featured = ""
featuredalt = ""
featuredpath = "date"
linktitle = ""
title = "JavaScript: Return considered harmful"
type = "post"

+++

JavaScript — the language of the Gods.

return — basically the GOTO statement of 2017_*_

_* T&C apply._

Born in the turbulent crucible of an asynchronous environment, with unpredictable response times and failure rates. For programmers coming from a traditional multi-threaded environment like Java or C#, JavaScript lives in strange and alien world where storms the size of entire planets rage, and lightning bolts pierce the ether.

The classic newbie mistake in JavaScript is to ask: “_Why doesn’t this work?_”

```javascript
const db = db.create('mydb');
const docs = db.list();
console.log(docs); // outputs 'undefined'
```

The reason is — as any lightly seasoned JavaScript developer can tell — that the `db.create` method is asynchronous. It returns undefined synchronously, and goes away to do its thing in the background. JavaScript is designed from the ground up for operation in a network environment where that database is most likely somewhere over a network, and accessing it requires unpredictable and potentially time-expensive network calls.

So `db.create` returns the result of its execution through a callback — and these days, potentially a Promise interface. Here it is with the classic callback interface:

```javascript
db.create('mydb', (err, db) => {
    const docs = db.list();
    console.log(docs);
});
console.log('Done!');
```

The function will output Done!, and then the list of docs. This is because the call to db.create doesn’t block, and execution of your function body continues while `db.create` does its thing in the background. You can think of it as “spawning a background thread that communicates with the main thread through a callback function”. We’re leaving aside here that `db.list` probably operates the same way, so in reality it will probably be more like this:

```javascript
db.create('mydb', (err, db) => {
    const docs = db.list((err, docs) => {
        console.log(docs);    
    });
});
console.log('Done!');
```

Here it is with error handling:

```javascript
db.create('mydb', (err, db) => {
    if (err) {
        return console.log('Error creating db', err);
    }
    const docs = db.list((err, docs) => {
        if (err) {
            return console.log('Error listing docs', err);
        }
        console.log(docs);    
    });
});
console.log('Done!');
```

This style of “callbacks within callbacks” leads to the so-called ‘pyramid of doom’ aka ‘callback hell’.

So, the Promise interface:

```javascript
db.create('mydb')
    .then(docs => db.list())
    .then(console.log);
```

A bit better, but still heavily indented and prone to hard to debug errors involving mismatching parens, especially when you are handling errors:

```javascript
db.create('mydb')
    .catch(err => console.log('Error creating db', err))
    .then(docs => db.list())
    .catch(err => console.log('Error listing docs', err))
    .then(docs => console.log(docs))
```

Enter async/await:

```javascript
function async getDocs() {
    const myDB = await db.create('mydb');
    const docs = await myDB.list();
    console.log(docs);
}
```

It allows you to program against functions that have a Promise interface using a style and mental model that maps to a synchronous world. Execution of your “main thread” is suspended while the asynchronous operation happens, so you should be aware that this is not a performant pattern when you have I/O operations that could run in parallel — it forces them to run synchronously, which means sequentially.

Here’s how you handle errors in this case:

```javascript
function async getDocs() {
    try {
        const myDB = await db.create('mydb');
        try {
            const docs = await myDB.list();
            console.log(docs);
        } catch (err) {
            console.log('Error getting docs', err);
        }
    } catch (err) {
        console.log('Error creating db', err);
    }
}
```

It looks very much like its equivalent in Java or C# — and that’s what this pattern is ideal for: simulating a single threaded, blocking, synchronous programming environment for programmers who come from that environment.

For a great overview of the three styles of handling asynchronous operations in JavaScript, watch this talk:

<iframe width="560" height="315" src="https://www.youtube.com/embed/K0ShhDbgRxk" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

Now here is why I say that return is considered harmful. 

The return keyword signals that execution should be halted in the current function and returned to the enclosing scope, and additionally that any argument provided to return should be returned to the caller.
You can see me using return in the first example, the callback one, in an idiomatic JS style:

```javascript
db.create('mydb', (err, db) => {
    if (err) {
        return console.log('Error creating db', err);
    }
    const docs = db.list((err, docs) => {
        if (err) {
            return console.log('Error listing docs', err);
        }
        console.log(docs);    
    });
});
console.log('Done!');
```

I’m using it here to halt execution in the current function block. However, I’m not intending the caller to consume the argument. The following returns undefined:

```javascript
return console.log('Some message');
```

It’s functionally equivalent to:

```javascript
console.log('Some message');
return;
```

It’s just a short-hand way to bail on the block.

However, on programming teams where some or all of the developers are used to synchronous environments, using return like this can lead to confusion — especially when you are using a mix of callbacks, Promises, and synchronous returns.

Part of the cause of this, is that you can return a Promisified call, like this:

```javascript
function createDBPromise(name) {
    console.log('If db has a Promise interface, this returns a Promise');
    return db.create(name);
}
```

This is subtly different from returning a synchronous `msg => void` function like `console.log`:

```javascript
function something() {
    return console.log('This returns undefined');
    console.log('And I did that so this line doesn't execute.');
}
```

or returning a callback interface `(name, db => void)` function like:

```javascript
function dbCallbackInterfaceSomething() {
    return db.create('mydb', (err, db) => {
        db.doSomething();
    });
    console.log('Returns undefined, and this line never executes');
}
```

In contrast to the second and third examples, the first example returns something — a Promise. So you can do this:

```javascript
function createDBPromise(name) {
    console.log('If db has a Promise interface, this returns a Promise');
    return db.create(name);
}

createDBPromise('mydb)
    .then(db => console.log('Do something with the db'));
```

When you use return for short-circuit exit of a block in front of a statement, like this:

```javascript
return console.log('Returns nothing!');
```

Your intent is ambiguous. Did you mean to return something for the caller or not?

With the advent of Promisified interfaces that do return useful objects, and the mix of synchronous functions that can return something, asynchronous callback functions that return nothing, and asynchronous functions that return a Promise, using `return something();` as a short-circuit exit when what you really mean is “return (nothing)” is an anti-pattern.

It will confuse programmers who are trying to understand the control flow of a program, or learning to implement control flows in JavaScript’s fundamentally asynchronous environment.

So I overstated my case in the headline. Here’s the actual premise:

`return () => void` considered harmful.