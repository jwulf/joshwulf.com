+++
author = "Josh Wulf"
categories = ["javascript", "programming", "typescript"]
date = "2020-12-01"
title = "Rate-limiting REST calls"
description = "Rate limiting REST calls on the client to avoid saturating an external resource."
linktitle = ""
images = ["/img/2019/01/zeebe.png"]
type = "post"
[twitter]
  card = "Limiting REST call rates to avoid saturating external resources."
  site = "@sitapati"
  title = "Rate-limiting REST calls"
  description = "Rate limiting REST calls on the client to avoid saturating an external resource."
  image = "https://www.joshwulf.com/img/2019/01/zeebe.png"
+++

A typical architecture involves your backend acting as a middle-tier connecting clients to a single external resource over REST: for example, a Discourse or Slack API.

The amount of requests issued to the remote REST API is proportional to the requests from the clients, so it is not directly under your control.

External REST services often implement rate-limiting, and will return a 429 status if you make too many requests in a short period of time.

To avoid this, you should rate limit the requests that your backend makes on behalf of or in response to client requests.

Ideally, you would match the rate limiting in your backend to the rate limiting in the external system. Some systems use a sliding window, allowing, for example, 1000 requests in a 5-minute window.

Implementing a sliding window requires state management in your rate limiter. We'll start by implementing a more simple rate limiting strategy: since we can do 1000 requests in a 5-minute window, we have a theoretical max average of ~3 requests/seconds. So a fixed 333ms delay between requests.

This is a naive implementation, because it means we cannot provide the maximum responsiveness with a bursting load: we _could_ in practice do 100 requests with no rate-limiting if that all the clients ask for in a five minute period. But we will also never get a 429 from the external system. 

## A Naive Rate Limiter 

{{< gist jwulf aec69da806a721b20a3e346e62eeb23b >}}

This naive rate limiter does have one slightly more sophisticated feature: it has two priority levels for rate-limited tasks. Low priority tasks can be marked as `preemptible`. These tasks will be run at a lower priority than those that are not, which will be drained from the queue preferentially. 

Even this is naive though, because you can starve the preemptible queue under sufficient sustained load.

Again, even to avoid this situation, we need to implement a sliding window, or else something naive like doing a 3:1 or similar ratio on the priority:preemptible queue processing.

## Preventing queue starvation: a naive approach

Let's implement the ratio processing, which is the simplest way to avoid starvation.

We'll use a modulo counter, and every time it hits zero, we'll preferentially process a preemptible task. Otherwise we'll preferentially process a priority task.

{{< gist jwulf 4b54b8db1e7d16662478d8ff54f014bd >}}

