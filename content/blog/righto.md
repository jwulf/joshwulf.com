+++
author = "Josh Wulf"
categories = ["javascript", "programming"]
date = "2017-06-10"
description = "An approach to async in Javascript you've probably never seen."
featured = ""
featuredalt = ""
featuredpath = "date"
linktitle = ""
title = "Righto — async done right in JavaScript"
type = "post"

+++

If you program in server-side JavaScript there is no way that you can avoid dealing with asynchronous functions.

Callbacks, Promises, and async/await are some of the ways that you may have heard of dealing with asynchronous programming in JavaScript. But you may not have heard of [Righto](https://www.npmjs.com/package/righto) — literally the best library of all time for async programming in JS.

Kory Nunn’s Righto library is — according to him — way better than Promises and Async/Await combined. I’ve always been intrigued and wanting to test that hypothesis, but haven’t been able to figure out how to use it.

The documentation is not so clear, and the few times I tried to figure it out, I couldn’t.

I got interested in Righto firstly because Kory kept preaching it; and secondly because he showed a demo at BrisJS where Righto produced more useful debug traces than Promises. On a recent flight from Dubai to Oslo, I spent a little time to play with it.

In a nutshell, Righto is “Promises with a CPS callback API”. Instead of chaining `.then()` and `.catch()` methods to a Promise, you call a Righto with a `(err, result) => void` callback.

Here is Righto by example. This is not a meaningful example that shows in any sense how Righto compares with async/await or promises. Rather, it is an example that is simple enough for you to get your head around.

OK, pretty simple concept here — I’m writing an express route handler. It takes a username parameter, and then returns a JSON object with the files in that user’s directory. Here it is Promise-style:

```javascript
app.get(‘getFilesList’, (req, res) => { 
    const username = req.query.username;
    getFileListForUser(username)
        .then(files => res.json({ok: true, files})
        .catch(error => res.json({ok: false, error});
});

function getFileListForUser(username) {
    return new Promise((resolve, reject) => {
        try {
            const files = fs.readdirSync(`${dirRoot}/${username}`); 
            resolve({files});
        } catch(e) {
            reject(e);
        } 
    });
}
```

We use a synchronous `fs.readdirSync` to read the directory contents, and put that inside a Promise, then send the response to the client in the Promise handlers.
Here it is as a righto-style:

```javascript
app.get(‘/getFilesList’, (req, res) => {
    const username = req.query.username;
    const dir = `${dirRoot}/${username}`;
    const filesList = righto(fs.readdir, dir);
    filesList((error, files) => {
        if (error) {
            res.json({ok: false, error});
        } else {
            res.json({ok: true, files});
        }
    });
});
```

The first thing we do is create a righto task for the `fs.readdir` task. You can think of this like a “Promisified-version” from back in the day when we use to do that kind of thing.

Now you can call the righto task and use it like it has a standard CPS callback signature.

So this creates a Promise-like eventual whose API is a CPS callback (the classic `(err, result) => void` signature).

Something to know about the righto task — it is executed once, and the result is cached. So if I do this:

```javascript
filesList((err, files) => console.log(files));
filesList((error, files) => {
    if (error) {
        res.json({ok: false, error});
    } else {
        res.json({ok: true, files});
    }
});
```

I will get a print-out of the files on the server console, but the `fs.readdir` task is only ever called once.

The first call will start the execution of the righto `fs.readdir` task. The second call may encounter the execution in-flight, and it is queued to be resolved when the `fs.readdir` eventual resolves.

Here is what provoked my investigation of Righto. In one of my methods, using Promises I was getting this error:

```
Listening on 8888
(node:20817) UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 2): Error: ENOENT:
no such file or directory, stat ‘sitapati’
(node:20817) DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.
```

I changed over to Righto, and the same bug now produces this error message:

```
Listening on 8888
Error: ENOENT: no such file or directory, stat ‘sitapati’at Object.fs.statSync (fs.js:907:18) 
at righto.all._candidates.map (/Users/sitapati/workspace/Minecraft/test/server-righto.js:97:21)
at Array.map (native)
at resolveFile (/Users/sitapati/workspace/Minecraft/test/server-righto.js:96:32)
at app.get (/Users/sitapati/workspace/Minecraft/test/server-righto.js:31:2)
at Layer.handle [as handle_request] (/Users/sitapati/node_modules/express/lib/router/layer.js:95:5)
at next (/Users/sitapati/node_modules/express/lib/router/route.js:131:13)
at Route.dispatch (/Users/sitapati/node_modules/express/lib/router/route.js:112:3)
at Layer.handle [as handle_request] (/Users/sitapati/node_modules/express/lib/router/layer.js:95:5)
at /Users/sitapati/node_modules/express/lib/router/index.js:277:22
```

That stack trace allows me to pinpoint exactly where the error is occurring. In asynchronous code that gets nested several layers deep, having to go under inception-style to locate bugs is not fun.

Perhaps the main benefit that Righto brings (and this is what Kory bangs on about) is the way that it surfaces errors explicitly and specifically.