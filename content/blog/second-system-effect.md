+++
author = "Josh Wulf"
categories = ["startups", "software engineering"]
date = "2017-09-27"
description = "How initially successful startups can fail when they develop v2"
featured = "second-system.png"
featuredalt = "Pic 3"
featuredpath = "date"
linktitle = ""
title = "The Second System Effect and Scaleup Failure"
type = "post"

+++
_This article was originally posted on [Medium.com](https://medium.com/@sitapati/the-second-system-effect-and-scaleup-failure-in-brisbane-80478c70efd)._

You validated your product-market fit. Your MVP was a hit. You even have paying customers (I already said that, right — it’s validated).

Then you started to develop the real deal, the product that built on your original success, while fixing the errors and short-cuts, and adding the cool new features — and it all fell apart.

So what the f*&# went wrong?

It’s simple.

You poured money onto a _second system_.

Fred Brooks distinguishes the second system in his 1975 book, _The Mythical Man-Month_:

> An architect’s first work is apt to be spare and clean. He knows he doesn’t know what he’s doing, so he does it carefully and with great restraint.

> As he designs the first work, frill after frill and embellishment after embellishment occur to him. These get stored away to be used “next time.” Sooner or later the first system is finished, and the architect, with firm confidence and a demonstrated mastery of that class of systems, is ready to build a second system.

> This second is the most dangerous system a man ever designs. When he does his third and later ones, his prior experiences will confirm each other as to the general characteristics of such systems, and their differences will identify those parts of his experience that are particular and not generalizable.

> The general tendency is to over-design the second system, using all the ideas and frills that were cautiously sidetracked on the first one. The result, as Ovid says, is a “big pile.”

— The Mythical Man-month, Fred Brooks

One of the best studies of second system failure in the modern era is [*Dreaming in Code*: Two Dozen Programmers, Three Years, 4,732 Bugs, and One Quest for Transcendent Software](https://en.wikipedia.org/wiki/Dreaming_in_Code), the tale of “Chandler” — Mitch Kapoor’s follow-up album to his smash hit “Lotus 1–2–3”.

## Second Systems, Startups, and the Brisbane market

One of the reasons I went to work at Just Digital People was for the opportunity to study a large number of startups and scale-ups from the inside in a short period of time. I wanted to see how software teams are built and managed at different phases; how funding is acquired and applied; how market traction is discovered and tracked; and crucially: how founders manage their internal state through this journey.

I’ve seen several teams disintegrate because they embarked on second system engineering.

Their initial, proven system is abandoned — whether they put it into maintenance, or spin up a second team to work on a re-implementation — and work begins on this new “v2” system that will be orders of magnitude more awesome.

### Real Examples from the Brisbane Market

Here are four real examples from the Brisbane market (I’ll share with you what happened with each further on):

* Company A starts Angular 2 reimplementation of their ASP.NET app as separate project with one developer. Leaves five developers on main product.
* Company B starts .NET replacement of their PHP system with a new five-person team. Leaves existing 20+ developers on main product.
* Company C starts Go replacement of their VB product with a new five-person team. Leaves existing 5-person team on v1.
* Company D starts Go replacement of their .NET system by moving entire dev team to new project. Leaves 2 developers maintaining v1 product.

## Why Engineers LOVE building Second Systems

The engineers love it, because everyone loves writing greenfield code. Code is famously easier to write than it is to read.

Reading your own code is easier than reading someone else’s code; but writing your own code is even easier than reading your own code from weeks ago.

So engineers love writing code in a green field.
You can do things the way that you want to do them. There are no constraints of previous choices (often poorly documented) to work within.

Here are the causes of failure in developing second systems — in addition to the ones that Fred Brooks identifies:

### 1. Abandoning the actual dynamic that generated success in v1 — validation.

It’s easy to misattribute the causes of the success of v1. It becomes the “founder’s visionary prowess”, or some “magical power of the company”. Either of which would be sufficient to ensure the success of the second system — if they were true.

However, what usually caused the success of the first system is iteration in close proximity to customers, with a solid feedback loop. This allows you to co-discover what works and what doesn’t work with actual users.

When you take this loop out, you are left designing a system against what you think that people want, or might want, or even what they say that they want.

No matter how good your ideas are, they are wrong in ways that you don’t know — and that you don’t know that you don’t know. They are wrong in ways that are in your blindspot. You need a methodology to uncover the unknown ways they are wrong as early and as often as possible.

Second systems often remove this system because “now we know what to build” (based on the first system).

No, you don’t.

You know what to start building and validate against real users. But second systems often omit the user feedback loop.

That’s fatal.

## 2. Abandoning the actual dynamic that generated success in v1 — user community

Second systems suffer a problem when they eventually do emerge from the laboratory. No-one cares.

Building v1 close to your users builds your community as it builds the product.

And this has another effect, it causes your project timelines. It generates timelines that pull you forward because real people are saying: “_Hey, when will this be ready?_”

Second systems are frequently built in isolation from customers. They are built in a clean room and will be rolled out “_when they are ready_”.

Which is frequently: never.

## What Happened to those Brisbane Examples

### Company A

* Company A starts Angular 2 reimplementation of their ASP.NET app as separate project with one developer. Leaves five developers on main product.

After some time, the founder realised that Spaceship A (version 1) was pulling away at such a rate that Spaceship B (version 2) would never catch it up. It was a moving target that could not be caught because of simple physics.

So he switched strategies — instead of attempting to reimplemented in Angular 2, he put the other developer onto Angular 2 implementations of portions of version 1. A “patchwork replacement” strategy.

> “A microservices architecture would have made it easier to do partial upgrades, rather than the monolith that we have, but we’re adopting a piecemeal approach because this is what we have.”

Company is privately held and funded on customer revenue.

### Company B

* Company B starts .NET replacement of their PHP system with a new five-person team. Leaves existing 20+ developers on main product.

After one year, the project was cancelled before going into production. The project did not deliver anything into production. All the technology was dismantled.

Total cost over $1m. Company is funded from customer revenue.

### Company C

* Company C starts Go replacement of their VB product with a new five-person team. Leaves existing 5-person team on v1.

The second system here was put into production as fast as possible, and is being developed with a set of customers. This company is walking the balance tightrope between both versions. Version 1 still accounts for 75% of their customer base and revenue. Version 2 accounts for 70% of their development spend.

This company is funded on customer revenue.

### Company D

* Company D starts Go replacement of their .NET system by moving entire dev team to new project. Leaves 2 developers maintaining v1 product.

Going “all on black”, this company divested itself of its organisational knowledge around version 1, by changing tech stack completely — and shifting their developers from v1 to v2.

Support for v1 customers stagnated, and execution on v2 stalled as they built a new team from scratch, learned a new tech stack, and built a new product in isolation of market feedback.

Basically “make all the things variables”. Exciting, but very high-risk.

This company is funded by venture capital.

## Second System Effect at Magikcraft

One of the things we grapple with at Magikcraft is the temptation to build a second system.

The main things that I’ve taken away so far from my observations is that software should go in front of real users as soon as possible, and should be delivered in small units — whether those are micro-services or feature releases.

One thing that can temper second system effect is to treat the entire endeavour as science. Each piece of functionality is a theorem, and it needs an experiment (deployment) to validate it.

Another useful model is to relate to unproven theoretical work as risk. As unproven theoretical work accumulates in the warehouse (undeployed code, or deployed yet unproven by users) the total amount of risk increases.

The total amount of risk, and the rate of risk reduction are key metrics that allow you to control second system creep.