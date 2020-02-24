+++
author = "Josh Wulf"
categories = ["javascript", "programming"]
date = "2020-02-23"
description = "A hot take on programming without them."
featured = "stack-overflow.png"
featuredalt = ""
featuredpath = "date"
linktitle = ""
title = "Just say No to loops and variables."
type = "post"
+++

Recently, I spent some time on StackOverflow, helping people with their school assignments - I mean, serious programming questions they had at work. (_I'm pretty sure a fair whack of them were homework assignments_).

One thing that came out of it - for me - was a pattern in the issues in the JavaScript programming tag (_Discord bots are hot right now with the kids_).

There are certain things that people struggle with when learning to program, and when learning to program in JS.

**Asynchronicity** is one. Callbacks not so much - mostly now people are struggling with Promises (which are a Monadic wrapper around an asynchronous operation), and with the subtle context impedance mismatch between async functions and non-async functions. Without TypeScript informing them of the type mismatch, they are baffled by code that is in a monadic async context interacting with code that is not. I mean: _they look the same_. At least with callbacks and Promises you have some clue in the indentation.

**Naming** is another one. The power of correctly naming entities in a program cannot be overestimated - I mean, it's one of the two hardest problems in computer science: caching, naming things, and whether or not to move to San Francisco. 

The impact of _not_ correctly naming things cannot be overestimated either. Confusing messes of spaghetti code where the programmer had wound themselves up in a ball of yarn and not only gotten trapped inside it, but forgotten what they were trying to do in the first place. In the end, I started to have some fun with it, telling one questioner that "_80% of programming is correctly naming things, and the other 20% is choosing the font for your IDE._" [JetBrains Mono](https://www.jetbrains.com/lp/mono/). (I solved his problem for him.) 

He had started with an entity named `x` and was now three levels deep trying to figure out how to iterate the data structure. The Tao becomes clear when you know that for each recipe we have an array of ingredients, and each ingredient has a set of attributes that characterize it.

As we read in [the Analects of Confucius](https://china.usc.edu/confucius-analects-13) ("_Confucius say_"): 

> Tsze-lu said, "The ruler of Wei has been waiting for you, in order with you to administer the government. What will you consider the first thing to be done?"

> The Master replied, "What is necessary is to rectify names." "So! indeed!" said Tsze-lu. "You are wide of the mark! Why must there be such rectification?"

> The Master said, "How uncultivated you are, Yu! A superior man, in regard to what he does not know, shows a cautious reserve.

> "If names be not correct, language is not in accordance with the truth of things. If language be not in accordance with the truth of things, affairs cannot be carried on to success.

Computer programming is an exercise in applied linguistics. It is precisely specifying the execution of operations to transform matter through the utterance of magic spells. Say the wrong thing, and _BOOM!_ you turn into a toad. The stakes are high.

**Mixing concerns** is another common one. A symptom of the confusion that arises from this - and I really do mean _confusion_ here: the _dosha_, or philosophical error described in the Sanskrit logical system of _Nyaya_ as _bhranti darshana_: a mistaken perception, literally: "an illusory vision". For example: thinking that a rope is a snake. That is _confused_: two things are _fused with_ each other in a way that they are no longer distinct, and one is mistaken for the other.

In Sanskrit philosophy, there is an entire school - _Samkhya_ - dedicated to the study of _separation of concerns_. _Samkhya_ is sometimes translated as "categorisation" or "distinction". 

According to Wikipedia:

> Samkhya means "to reckon, count, enumerate, calculate, deliberate, reason, reasoning by numeric enumeration, relating to number, rational." In the context of ancient Indian philosophies, Samkhya refers to the philosophical school in Hinduism based on systematic enumeration and rational examination.

It comes from two words: _Sam_ meaning "the whole" or "totality" (from which the English word _sum_ comes to us), and _khya_ meaning _to name_. The founders of this philosophical system were totally into enumerating everything categorically, and describing the relationships between categories as an access to understanding the whole. 

In modern software development [separation of concerns](https://en.wikipedia.org/wiki/Separation_of_concerns) is a widely accepted best practice for reducing complexity and technical debt.

## Mixed Concerns lead to Exponential Complexity 

One thing I noticed many novice programmers struggling with was the mixing of the concerns of data transformation - essentially a functional concern - with imperative flow control.

Nothing wrong with that, but it lead them into situations where they experienced overwhelming complexity. They couldn't get the data transformation that they wanted, _and_ they were struggling with building a custom state machine to produce it at the same time. The intersection of these two problems lead them to throw up their hands and turn to StackOverflow.

As I said to one questioner: "_when you solve a problem using loops and variables, now you have three problems_". You have to build a custom state machine, track mutable state, _and_ you still have the original problem you were trying to solve.

Now, seasoned programmers can often look at these trivial (to them) situations and see a clear way out of the scenario the new programmer has gotten themselves into, and guide the novice to correctly construct the state machine, correctly initialise and scope the variables, and get the desired data transformation with the resulting system - and you might think "_what's the big deal?_"

It can even be a mark of pride to be able to tame it in this way. However, the novice programmer's dilemma is a microcosm that simply scales up when they continue to code this way with more prowess.

## So, the Hot Take 

I overstepped the mark in one question. This particular week, I was in the top 0.11% of StackOverflow contributors worldwide, as recognized by the community on StackOverflow (thank you, you're welcome), and on a burn.

To one question, I said: 

> I can see two problems with your code straight away:
> 1. Loops 
> 2. Variables 

I wrote a solution that used no custom state machine (no loops), and no mutable variables.

Another StackOverflow contributor wrote a functioning custom state machine with mutation that also solved the problem domain, and I commented:

> Also, loops and variables! The more of those you do, the more complexity and moving parts you have to debug. Solid effort though. Pretty cool using a RegEx.

To which he took affront - fair enough. He said:

> @Josh Wulf - There is no reason not to use loops and variables in code. You are ridiculous. You should know that using certain convenience functions of Array are slower performing than using for loops. Filter is actually a loop that iterates through all elements of an array, and it performs slower than for loops across the board. I recommend keeping your comments constructive and avoid passive agressive remarks like "Solid effort though." Its actually a viable solution for many cases. I even pointed out that another solution on the thread might be better. Maybe write a blog where you critique? 

Ouch!

I apologised to him, because I did overstep the mark with that comment. It's fine to have a perspective on something, but leaving a member of our professional community, who is giving their free time to contribute to others, with the experience of being disrespected is not what I am committed to.

So, I apologised, and accepted his request to write a blog article about it. Thank you to that member of our community for holding me to account to the level of professional courtesy and respect that you are due, and for the opportunity to write this blog.

Here we go:

## State Mutation and Complexity 

Mutable state in a program is _additional complexity_. 

More variables means more moving parts: _mo' vars mo' problems_. If an assignment is declared as mutable, guarantees about that assignment are weakened. This means that reasoning about the eventual value of that assignment in other parts of the program is complex. With TypeScript (on a strong setting), the transpiler will make a strong assertion about the _type_ of the value, to reduce complexity, but it cannot make any guarantees about its eventual _value_. Without TypeScript, _neither_ is guaranteed. (And at run-time, all bets are off, so you are at the mercy of the accuracy and consistency of your typings).

Deliberately reducing complexity by choosing to eschew the mutant is a programming discipline, and one that I believe pays off.

Douglas Crockford wrote the famous book [JavaScript: The Good Parts](https://www.amazon.com.au/JavaScript-Good-Parts-Douglas-Crockford/dp/0596517742), where he shared his discovery that if he deliberately avoided certain parts of the language - artificially constraining himself to a subset of the language - his productivity improved.

I believe that variables belong in the category of "things to avoid".

I took on programming without variables, and there has only been one case where the word `let` has left my mouth in the past two years:


```
let result
try {
    result = await asyncOpThatMayThrow()
} catch (e) {
    return handle(e)
}

try {
    await useResult(result)
} catch (e) {
    return handleThis(e)
}
```

This is something that I have grappled with, because it is at the intersection of another programming discipline that I adopted: _striving for a single level of indentation_. 

Memories of grappling with deeply nested code bases, trying to figure out which level got unbalanced, and ending up with code that would again lint and run, but that I wasn't sure still produced the same effects, lead me to that.

I recently resolved this, and that `let` is no more for me - but that is another blog post.

I see novice programmers declaring variables as `let` and `var`, sometimes interchangably in the same code, with no reassignment of their value in the scope. Why would you do that? These declarations communicate your intent to the machine and other programmers: "_I intend that the value of this assignment change over the course of execution_". 

When you don't change it, why communicate that intent? You have incorrectly named a thing.

And when you _do_ mutate it, you make it necessary for the machine and more importantly, for other programmers to then trace the flow of execution through the code base to reason about its value in different places.

And when you make a coding error, and accidentally mistype a variable name (because you gave them non-descriptive, or similar names), you just created a "_case of mistaken identity mutation_" bug in the program. And no reasoner can detect your unintended mistake and warn you of it, because _variables_.

Just say No to variables. Try it for one year (_I know that seems like a long time if it represents a significant percentage of your programming career to date_).

If you are a new programmer struggling to get your data transformation to work, reduce the complexity - take out one of the variables: _variables_.

## Custom State Machines: Loops 

Loops are problematic in several ways.

Oftentimes, armed with the loop and an array of data to transform, a novice programmer will frame the problem as: "_I have to transform every element in this array_". So they make a loop, with side effects. If those side-effects are asynchronous, now they are dealing with three problems.

That's an explosion of complexity, and leads to complex and fragile constructions that are resistant to refactoring. As the novice (or maintenance) engineer iterates on the data transformation taking place in the loop, the coupling of the state machine with the data transformation can cause the state machine to break, or to require a change in the state machine to accomodate a change in the data transformation. This is especially problematic for the novice programmer who is trying to get both to work at the same time. Now they are solving a two variable problem when they started with one!

Niklaus Wirth's classic work on programming distinguished two categories: [Algorithms and Data Structures](https://www.amazon.com/Algorithms-Data-Structures-Niklaus-Wirth/dp/0130220051). A third concern in a program is _control flow_ - in distributed systems it is _processes_ - directed evolution of the program (system) state over time.

By using a loop, you are putting all three in one place. Many novice programmers (and experienced ones working on new systems) are operating without a clear picture of the eventual shape of the data that they need to model the state and the transformations required to achieve the outcome. When you put all three in one place, you now have a three-variable equation that you are trying to solve at once.

And you are doing it by building the machine that will apply the transformation to the data structure, manually.

This, I believe, is at the core of the breakdown for many of the novice programmers who loop themselves into a knot with these assignments - I mean, work problems. They end up going: "_What the heck am I even doing???_"

The complexity is _too much_.

And what got missed, right at the outset, is that the problem is **not** "_apply a transformation to every element in this array_". 

That is the automatic GOTO (_sorry, couldn't resist_) of the programmer armed with a loop.

The problem is in fact, much, much simpler. It is: "_apply a transformation to **each** element in this array_".

Once this is grasped, the separation of concerns becomes clearer: 

"_I need to write a data transformation function that takes one element and returns one transformed element_."


"_And I need to apply this transformer function to each element in the array_."

The problem has suddenly reduced in both scope and intersectional complexity.

The state machine and the transformation are now separate concerns, whose complexity can be reduced independently.

Loops are imperative control flow constructs. They can be used well, but they are dangerous. They couple control flow with transformations / side effects. I believe they cause more harm than good, especially for novice programmers, because they obscure the separation of concern.


Compare this: 

```
function countNumbers(arr) {
    var count = 0;
    for (num in arr) {
        if (Number(arr[num]) !== NaN) {
            count++;
        }
    }
    return count;
}
```

With this:

```
const isNum = n => !isNaN(parseInt(n));
const countNumbers = arr => arr.filter(isNum).length;
```

In the second, the two concerns are separated and named. They are not intermixed.

The data transformation function can be unit tested with ease, and can be refactored without impact on the state machine. The code for each lives in a distinct location and isolated context.

The problem is much clearer. 

Once the state machine is in place (`Array.filter`), the design of the data transformation can be iterated on with an automated test suite with ease, leaving the programmer to focus on one thing only. 

A mistake in syntax while doing that can only break one thing. The programmer is not grappling with and changing code that affects two concerns at the same time.

There is no mutation to track (another surface area for bugs). 

This is a microcosm, but I believe one that perfectly expresses as a koan the power and beauty of taking a vow to deliberately avoid using variables and loops.

I will not overstep my bounds by making an evangelical claim of some absolute truth, and I invite you to try it. Program without variables and loops, and observe how it changes the way that the problems in front of you present themselves, and what solutions emerge from taking on this discipline.
