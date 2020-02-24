+++
author = "Josh Wulf"
categories = ["javascript", "programming", "stackoverflowed"]
date = "2020-02-24"
description = "A StackOverflow refactoring."
featured = "stack-overflow.png"
featuredalt = ""
featuredpath = "date"
linktitle = ""
title = "Avoiding global mutable state in browser JS"
type = "post"
+++

_This is part of [a series of posts](https://www.joshwulf.com/categories/stackoverflowed/) where I refactor code from StackOverflow questions, with a discussion of the changes. One of the great things about JavaScript is how scalable it is. You can start with a simple script, and there is nothing wrong with that. Usually these posts are about refactorings other than what the questioner asked about, and would be out of scope for the SO answer._

Global scope is a feature of browser JavaScript that is a source of application-spanning bugs (it _is_ global).

Any local function can mess with the functioning of any other function by mutating global scope. This is an entire bug surface area, and can result in bugs that are hard to track down to their source.

In this refactoring we are not going to be able to completely eliminate global state - mostly because we don't have enough information about how the state will be used in the rest of the application to make a recommendation for an alternative. 

What we will do is reduce the bug surface area significantly. And along the way, you'll be introduced to some of the concepts underlying `React.setState` and Redux.

## The Question

Here is the code from StackOverflow:

```
//global variable
var memArray  =[];

//object    
function member(id, password){
  this.id          = id; 
  this.pwd         = password
  }
  var memObj1=new member("m001","123");
  memArray.push(memObj1);
```

## Discussion

There is a lot going on this example that can be refactored, and we'll look at a number of things in other articles. But for now, let's look at global state.

### memArray

The global `memArray` has two immediate issues - apart from being global. 

* `var`

First, it is declared as `var`, which means that it can be reassigned at runtime. 

In fact, using `var` is a declaration to the machine and to other programmers that "_I intend that the value of this assignment change over the course of execution_".

It may be that the novice programmer misunderstands assignment of arrays in JS. Making this a var doesn't make the contents of the array mutable - you have to do deliberate work to make them immutable. Rather, declaring this as `var` makes _the assignment itself mutable_. Meaning that `memArray` can be mutated by pointing it to something other than the array you just created and assigned to it.

Somewhere deep in the code, a function could do:

```
memArray = []
```

This could be because another programmer uses it as a local variable name with no declaration, in which case the runtime will use the previously declared global variable. You won't get a warning from your tools about using an undeclared variable, because _it is declared_.

The chances of this happening are increased because of the second issue:

* Naming

See this article about [the importance of naming](https://www.joshwulf.com/blog/2020/02/just-say-no-to-loops-and-variables/).

In code examples on StackOverflow, I always name global variables like this: `EvilGlobalMembersArray`.

There is no way someone is accidentally reusing that in a local scope. At the very least, `GlobalMembersArray` is an unambiguous name that communicates what it is.

## First Refactor

```
const GlobalMembersArray = []
```

Make it a `const` so that it cannot be reassigned, and give it a meaningful and useful name. This is naming by convention that takes away cognitive load when reading the code. If I find a reference to `GlobalMembersArray` in a function deep in the code, I immediately know what I am looking at.

## Mutation 

The global is now _not_ reassignable, and unambiguously named, which reduces the chances of someone accidentally reusing it. Since it is an array, they cannot change the reference to point to another array, object, or primitive, but they _can_ mutate the contents.

Presumably, we are going to want to add to, remove from, and update elements in this array.

By exposing only the array as a global variable, we have devolved responsibility for mutating it to local functions in the application.

That concern, and hence the complexity of it, is now spread throughout the application. Bugs related to mutating the array values can appear anywhere in the application, at any time. And again, they can be hard to track down, because they will likely appear when a function uses the array and doesn't find what it expects - rather than where the bug exists.

## Second Refactor - IIFE

Rather than expose an array, we should expose an object that encapsulates the state, _plus_ mutation methods. And we will not expose the actual state, because local functions can still and may be tempted to mutate it directly. Instead we will return _a copy of the state_, so that the only way to update it is via the object methods.

We can do this using an IIFE - an [Immediately Invoked Function Expression](https://en.wikipedia.org/wiki/Immediately_invoked_function_expression), a JavaScript function that immediately executes and can return an object that has a private scope inside a closure.

In terms of ES6 classes, it is roughly analogous to creating an instance of a class that has private methods.

Here it is with no accessors:

```
const GlobalMemberStore = (() => {
  let _members = []
  return {}
})()
```

Note the enclosing `()` and the immediate invocation. In this case we will get back an Object with no properties. But what you want to know is that it also contains a hidden array - `_members` - that cannot be accessed by local functions.

_But, but... aren't you the "[Just Say No to Variables](https://www.joshwulf.com/blog/2020/02/just-say-no-to-loops-and-variables/)" guy? What is that `let` statement doing there?!_

Look, we _can_ remove variables completely. But we don't have enough information about the eventual application to do that. So what I've done here is take a global variable, and put inside a closure where _it is invisible to the rest of the application_.

All the complexity and bug surface area will be behind the singularity of the closure, with an immutable API. There will be no variables exposed to the rest of the application.

## Implementing `getMembers`

Now we will provide a method to return _a copy_ of the `_members` array:

```
const GlobalMemberStore = (() => {
  let _members = []
  return {
    getMembers: () => [..._members]
  }
})()
```

The [ES6 spread syntax](https://javascript.info/rest-parameters-spread#spread-syntax) - `[...members]` - _spreads_ the contents of the local members array into a new array, and returns that. 

Local functions can add things to the array, or delete elements, but these operations do not affect the global state, because they have _a copy_ of the global state, not a reference to the global state. 

Note, however, that because the elements of the array are _objects_, local functions can still mutate members within the copy, and that _will_ affect the global state - because they are references to objects. 

We can avoid that scenario like this:

```
const GlobalMemberStore = (() => {
  let _members = []
  return {
    getMembers: () => _members.map(m => ({...m}))
  }
})()
```

[`Array.map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map) returns a new array, so the consumer has no reference to the global state array.

In the map [predicate function](https://en.wikipedia.org/wiki/Functional_predicate) - `m => ({...m})` - we return a _copy_ of each member object from the `_members` array, again using the ES6 Spread syntax, this time on an object.

Now, local functions have access to the global members state, but it is immutable. They cannot update the global state from the copy that they get. For that, they will need to call an update method.

## Implementing `setMembers`

The first method we will implement is a hydration method that allows a local function to pass in an array of members.

I'll take out `getMembers` for now to make it easier to read:

```
const GlobalMemberStore = (() => {
  let _members = []
  return {
    setMembers: members => _members = members.map(m => ({...m}))
  }
})()
```

Here we use the Spread syntax to copy the members to a new array, and this becomes the global members. 

This means that a local function cannot set the global state by passing in an array of members, and then mutate the global state by mutating one of the members that it passed in.

If we did a naive assignment:

```
setMembers: members => _members = [...members]
```

Then the local function calling this method would have a local reference to the member objects that are now in the state store. By spreading them, we make a copy - another object in memory that the local function has no reference to.

## Implementing `updateMember`

It is likely that a business requirement for this application is that you can update a member. 

So, we will implement an `updateMember` function. We will use `Array.map` to return a new array. A naive approach to this might be "_let's iterate over the array using `forEach` and mutate the element we are updating_". See the post "[Just Say No to Loops and Variables](https://www.joshwulf.com/blog/2020/02/just-say-no-to-loops-and-variables/)" for an in-depth explanation of why you _don't_ want to do that.

To implement the predicate function, let's describe what we want it to do in plain language:

> For each member in the state,

>  if the member id equals the id of the update, return the update;

>  otherwise return the member.

So, our predicate function looks like this:

```
member => member.id === update.id ? update : member
```

We are using the [ternary operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_Operator) here to implement `if-then-else` in a single expression.

We can probably shorten the name we use for `member` to `m`, because the context is sufficient to provide information about what it is:

```
const GlobalMemberStore = (() => {
  let _members = []
  return {
    updateMember: update => (_members = _members.map(m => m.id === update.id? update : m))
  }
})()
```

We enclose the assignment operation `_members = ` in parens `()` to indicate that we did not forget to return a value, and intended only the side-effect. We could have put it in `{}`, but that will cause code formatters to turn our single line into three.

## Designing for failure

20% of programming is getting it to work. The other 80% is programming for _when it doesn't work_. 

What happens if a local function requests to update a member who is not in the state? At the moment, the local function receives no information from the call to `updateMember`, and if you look at the code, what will happen is... nothing.

The predicate function will never match, and the new state will be a new copy of the existing state, unmodified.

We could throw an exception. This gives us the opportunity to figure out where the bug in the application is that it is trying to update a member that doesn't exist. This is a good idea.

Let's throw an exception so that the root cause can be debugged in the local function. To do this, we will need a `getMember` function that we can use. So, let's implement that.

## Implementing `getMember`

It's likely that local functions will want only a single member. If we don't implement it here, we will have local functions retrieving the entire state and filtering it. This leaks complexity into the application, because we _can_ do that in "one place, and one place only" in the application: _here_.

Then we only have to test it in one place, and we only ever have to get it to work in one place. That reduces the surface area for bugs in the application.

We can use [`Array.filter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) to find elements in an array. `Array.filter` returns a new array containing only the elements from the original array for whom the predicate function returned true.

The predicate function is straight forward:

> Return true if the `member.id` equals the requested `id`;

> otherwise, return false

Reducing that down, we get:

> Return `member.id` equals requested `id`

or:

```
m => m.id === id
```

So,

```
const GlobalMemberStore = (() => {
  let _members = []
  return {
    getMember: id => _members.filter(m => m.id === id)
  }
})()
```

The `getMember` array will now return an array with either zero (if no member with that id exists in the state) or one... hang on, what happens if there is more than one member in the array with the same `id`? In that case it will return more than one member.

Probably, the business requirement is that member `id` is unique. So we will take that into account when we write the `addMember` function.

So it will return an array with 0 or 1 members in it. Probably local functions want a member or `undefined`.

Although, we can provide a better API if we return an object like this:

```
{
  found: true
  member: Member
} |
{
  found: false
  member: undefined
}
```

Then consumers of this API using TypeScript can use a [Type Guard](https://medium.com/@sitapati/implementing-a-maybe-pattern-using-a-typescript-type-guard-81b55efc0af0) to get safety against accessing an `undefined` value, and our API forces them to use it.

This reduces bugs. Otherwise, we are relying on every local function in the application remembering to test it for `undefined` before accessing it - another surface area for bugs.

So: 

```
const GlobalMemberStore = (() => {
  let _members = []
  return {
    getMember: id => {
      const member = _members.filter(m => m.id === id)
      return member.length === 1 ? 
        { found: true, member: member[0]} :
        { found: false, member: undefined }
    }
  }
})()
```

Nice API.

## Throwing on impossible update

We can now consume `getMember` from our own API to guard against an update error. 

How can we do that? We need to lift our API to its own context inside the closure, like this:

```
const GlobalMemberStore = (() => {
  let _members = []
  const Store = {
  }
  return Store
})()
```

Now we have a private reference to our own API, as `Store`. So we can use it to see if the member that the local function wants to update, actually exists - and if not, throw.

```
const GlobalMemberStore = (() => {
  let _members = []
  const Store = {
    updateMember: update => {
      const member = Store.getMember(update.id)
      if (!member.found) {
        throw new Error(`No member with id ${update.id} in the store!`)
      }
      _members = _members.map(m => m.id === update.id? update : m)
    }
  }
  return Store
})()
```

## Implementing `putMember`

Probably, a business requirement of the application will be to put a new member in the store.

We have to make a decision here about the behaviour of the store. What happens if a local function attempts to put a member with an `id` that is already in the store? 

That's probably a bug somewhere further upstream in the application logic, so we will throw an exception to allow debugging to start.

So we can do this:

```
const GlobalMemberStore = (() => {
  let _members = []
  const Store = {
    putMember: member => {
      if (Store.getMember(member.id).found) {
        throw new Error(`${member.id} already exists!`)
      }
      _members = [..._members, {...member}]
    },
    updateMember: update => {
      const u = needsMember(needsArg(u))
      const member = Store.getMember(u.id)
      if (!member.found) {
        throw new Error(`No member with id ${u.id} in the store!`)
      }
      _members = _members.map(m => m.id === u.id? update : m)
    }
  }
  return Store
})()
```

## Dealing with a undefined id

Another potential bug that we can detect here is a local function passing in either `undefined` or a member with an `id` that is undefined. 

We can write helper functions for this, and call them on all operations where it is a requirement:

```
const GlobalMemberStore = (() => {
  let _members = []
  const needsArg = arg => {
    if (!member) {
      throw new Error (`Undefined passed as argument to Store!`)
    }
    return arg
  }
  const needsId = member => {
    if (!member.id) {
      throw new Error (`Undefined id on member passed as argument to Store!`)
    }
    return member
  }
})()
```

Here is how we use this:

```
const GlobalMemberStore = (() => {
  let _members = []
  const Store = {
    putMember: member => {
      const m = needsId(needsArg(member))
      if (Store.getMember(m.id).found) {
        throw new Error(`${m.id} already exists!`)
      }
      _members = [..._members, {...m}]
    }
  }
  return Store
})()
```

## Freeze!

For our final touch, we are going to freeze the API object using [`Object.freeze`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze):

```
return Object.freeze(Store)
```

This prevents anyone from overwriting or modifying the API methods themselves.

If you wanted, you could (deep) freeze all the return values from the API methods. That would deny local function consumers of the objects the ability to mutate the return values. They would need to use spread on them. We're not going to do that right now.

Freezing objects has an impact on performance. Freezing the API is not going to make a huge difference, so the safety is worth it. The objects returned from the API are copies, so freezing them is overkill, IMHO.

## Putting it all together

Here is the whole thing:

```
const GlobalMemberStore = (() => {
  let _members = []

  const needsArg = arg => {
    if (!arg) {
      throw new Error (`Undefined passed as argument to Store!`)
    }
    return arg
  }
  const needsId = member => {
    if (!member.id) {
      throw new Error (`Undefined id on member passed as argument to Store!`)
    }
    return member
  }

  const Store = {
    setMembers: members => (_members = members.map(m => ({...m}))),
    getMembers: () => _members.map(m => ({...m})),
    getMember: id => _members.filter(m => m.id === needsArg(id))
    putMember: member => {
      const m = needsId(needsArg(member))
      if (Store.getMember(m.id).found) {
        throw new Error(`${m.id} already exists!`)
      }
      _members = [..._members, {...m}]
    },
    updateMember: update => {
      const u = needsId(needsArg(update))
      if (!Store.getMember(m.id).found) {
        throw new Error(`${m.id} does not exists!`)
      }
      _members = _members.map(m => m.id === u.id? update : m)
  }
  return Object.freeze(Store)
})()
```

This may seem like way more complexity than: 

```
var memArray = []
```

However, this is the _actual_ complexity involved in this data structure in the application. _You will end up doing all of this anyway_, but it will be spread throughout your application in manipulation and mutation of that array, and `if` statements, and fixing bugs in various places.

And it will be really hard to refactor in the future.

With this approach, the total technical complexity of this concern is now encapsulated in one place in your application.

#winning

## Further Resources

This approach to state management has become popular in JS in recent years, and is the basis of the approach used by:

* [React `setState`](https://reactjs.org/docs/state-and-lifecycle.html)
* [Redux](https://redux.js.org/introduction/getting-started/)
* [Flux](https://www.freecodecamp.org/news/an-introduction-to-the-flux-architectural-pattern-674ea74775c9/)
* [Immutable.JS](https://www.npmjs.com/package/immutable)
* [Nanoflux](https://github.com/ohager/nanoflux) (_My personal favorite_) 

If you grasped the concepts and rational for the refactorings that I made in this example, you will be well-placed to understand these mature, more sophisticated (and generalised) implementations.