+++
author = "Josh Wulf"
categories = ["hackathon", "events"]
date = "2017-03-29"
description = "Yay! We won a Hackathon!!"
featured = "winners.jpeg"
featuredalt = "#winning"
featuredpath = "date"
linktitle = ""
title = "2017 Flight Centre Data Hackathon Winners"
type = "post"

+++

On 26 March, we took out second place in the 2017 Flight Centre Data Hackathon. Our team was a mix of engineers, designers, and business analysts from Magikcraft.io, Code Network, Just Digital People, and Just Media Design. A few of us have worked together on projects before, a few of us know each other but have never worked together on a project, and some of us met for the first time at Fishburners on the Friday night of the Hackathon.

In the qualifying pitching round, the judges asked us: “_What’s your idea?_”

My response:

> Whatever it is, it’s wrong.

> Whatever we build this weekend is not the thing. It doesn’t matter what our first approximation is — we’ve got to deploy it and measure it and iterate on the feedback. And so what we’ve built is a Data API that allows us to create light-weight, low-cost data experiments; collect feedback from them; and throw them away and release a new iteration.

And we built two experiments using the API: a Facebook chatbot that had 30% engagement with cold contacts and nurtured them as leads while collecting preference data from them; and an iPad app that presented customers with trip suggestions and enriched their customer profile with their preference data.

{{< fancybox path="/img/2017/03" file="experiments.gif" caption="Light-weight, low-cost experiments" gallery="Gallery Name" >}}

This is a central point of lean / agile development: light-weight experiments, feedback loops, and the continuous delivery of incremental value. We focused on creating feedback loops and delivering the maximum number of iterations during the hackathon — continuously delivering and focusing on getting in front of real users as fast as possible, and measuring the effectiveness of what we created against the only source of truth: customer validation.

And we discovered our central premise along the way — that Flight Centre’s biggest problem is a lack of innovation agility around their data. They don’t currently have the means to iterate rapidly over disposable solutions: hence the API as our ultimate “product”.

{{< fancybox path="/img/2017/03" file="gates.jpeg" caption="Innovation agility is a significant competitive advantage" gallery="Gallery Name" >}}

Before the first pitches even began, we put in place our “push-to-publish” pipeline. It took us less than 30 minutes to get the central infrastructure in place that we used throughout the weekend: a GitHub repository linked to an [IBM Bluemix](https://bluemix.net/) DevOps Pipeline.

{{< fancybox path="/img/2017/03" file="pipeline.png" caption="" gallery="Gallery Name" >}}

We then created a boilerplate Bluemix Node.js application and pushed the code to the GitHub repository. This gave us a scaffolded Express app with a dedicated Cloudant instance backing it. Now all we needed to do during the weekend was git push to master, and it redeployed automatically. We hooked it up to Slack so that we would get notifications across the team, and we were good to go.

{{< fancybox path="/img/2017/03" file="build.png" caption="" gallery="Gallery Name" >}}

The point here is that the underlying infrastructure was in place to allow us to iterate on top. Frictionless.

IBM Bluemix DevOps is Jenkins under the hood. It’s basically the boilerplate Jenkins job that you set up all the time for continuous delivery of a web app. Cloudant is CouchDB under the hood. And the PaaS that we’re deploying into is [Cloud Foundry](https://www.cloudfoundry.org/). So it’s all open standards, portable stuff. No vendor lock-in.

{{< tweet 830130813832482816 >}}

I got really clear on the importance of a continuous delivery pipeline in a talk given by Mouna Neelakantha, a Readify consultant, on the JDP Internship. She said:

> On our first day on any engagement, the very first thing we set up is a continuously delivery pipeline, and we must push something to production before the close of business on that day. It might just be a home page — whatever; but it is something that demonstrates visible value to the client; and we then have the ability to continuously deliver incremental value.

We did not revisit our deployment pipeline for the rest of the hackathon. It became invisible. We just pushed to master and it deployed to production. We could focus on innovation and value creation at the layers where we could actually add value. And because we had a delivery pipeline and production environment that supported it, we could experiment with no cost in reconfiguring the underlying infrastructure.

And it became apparent that this same infrastructure was not in place for the data. It was a stark contrast. Hence our realisation that a Data API would be a valuable product — in fact, it would enable multiple valuable products.

It’s not your product that matters, it’s the speed with which you can make your product more relevant.
We also experimented with IBM Watson sentiment analysis, although we didn’t have a huge amount of time to do that. However, it was easy to add it in to the app using the Bluemix services.

I’ve used AWS and I’ve used Azure, and even with more experience with AWS (I’ve been using it since 2008), we could not have wired either of those up as fast as we did with IBM Bluemix.

I have to say that the innovation agility of IBM Bluemix both empowered, and inspired our winning effort at the 2017 Flight Centre Data Hackathon.