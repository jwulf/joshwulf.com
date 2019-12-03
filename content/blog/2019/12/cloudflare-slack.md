+++
author = "Josh Wulf"
categories = ["Zeebe", "serverless"]
date = "2019-12-03"
description = "A Cloudflare worker that provides a zero-scale Slack messaging task for Camunda Cloud, using the Camunda Cloud HTTP Worker."
featured = "serverlessComputing.jpg"
featuredalt = ""
featuredpath = "date"
linktitle = ""
title = "Going to Zero-Scale Zeebe on Camunda Cloud with Cloudflare Workers"
type = "post"

+++

I get questions about running Zeebe at "zero-scale". That means workers that consume no resources when there are no tasks to perform.

The Zeebe service on [Camunda Cloud](https://zeebe.io/blog/2019/09/getting-started-camunda-cloud/) includes a generic HTTP-Worker that can be used to achieve this. The HTTP-Worker polls for jobs of type "Camunda-HTTP", and then invokes a REST endpoint based on the HTTP verb and URL set in the task headers. In combination with "serverless" functions, this can be used to achieve a zero-scale architecture.

[Cloudflare workers](https://developers.cloudflare.com/workers) are serverless processes that run in response to REST requests at the edge of Cloudflare's hosting infrastructure. "At the edge" means that a request to a Cloudflare worker is routed to the nearest point in Cloudflare's infrastructure and executed there.

Cloudflare workers can be written in JavaScript, or in [WebAssembly](https://blog.cloudflare.com/webassembly-on-cloudflare-workers/).

[This](https://github.com/jwulf/slack-cloud-worker) is a Cloudflare worker that provides a zero-scale Slack messaging task for Camunda Cloud, using the Camunda Cloud HTTP Worker.

On the free tier of Cloudflare Workers, you can send 100,000 messages a day.

The code is simple - most of the complexity is moved to configuration:

{{< highlight javascript >}}
const micromustache = require('micromustache')

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  if (request.method === 'POST') {
    const body = await request.json()
    const message = request.headers.get('message') || body.message || ''

    const renderedMessage = micromustache.render(message || '', body || {})
    const slackwebhook = request.headers.get('slackwebhook')
    const channel = request.headers.get('channel')

    await fetch(slackwebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: channel || '#general',
        text: renderedMessage,
      }),
    })
  }

  return new Response(
    {},
    {
      headers: { 'content-type': 'application/json' },
    },
  )
}

{{< /highlight >}}

## Setup

### Slack Setup

1. Go to your Slack.
2. Click on the part that has your name and the Slack team name, then go to "Customize Slack".
3. Click on "Configure apps".
4. Search the App Directory for "Incoming WebHooks".
5. Click on "Add to Slack".
6. Choose a channel, then click on "Add Incoming WebHooks integration"
7. Copy the Webhook URL.

### Cloudflare Setup

1. Sign up for a [Cloudflare Workers account](https://dash.cloudflare.com/).
2. Clone [this repo](https://github.com/jwulf/slack-cloud-worker), then cd into the checked out directory and run `npm i`.
3. Install `wrangler`, the Cloudflare Worker CLI:

```bash
npm i -g wrangler
```

4. Grab your Account ID from your [Cloudflare dashboard](https://dash.cloudflare.com/) (click on Workers on the right). Put the Account ID into `wrangler.toml` in the `account_id` field.
5. Create a new API key in your Cloudflare account. Click on "Get your API token" under your Account ID, and create a new token with Permissions: Account > Workers Scripts > Edit.
6. Copy the API key.
7. Run `wrangler config`.
8. Enter the email address of your Cloudflare account, and paste in the API key.
9. Now publish the worker with `wrangler publish`
10. Copy the url of your deployed Cloudflare worker.

### Camunda Cloud Setup

1. Log in to your [Camunda Cloud](https://console.cloud.camunda.io/) account.
2. Go to the configuration screen for your cluster.
3. Click on "Worker Variables" next to the HTTP-Worker.
4. Create a new variable `slackWorkerUrl` and paste in your Cloudflare Worker url.
5. Create a new variable `slackWebhook` and paste in your Slack webhook url.

## Use

Check the `bpmn/test-message.bpmn` file for an example. 

To send a message to Slack in a business process, add a task with the Type "CAMUNDA-HTTP".

{{< fancybox path="/img/2019/12" file="task1.png" caption="" gallery="Gallery Name" >}}

Set these Headers on the task:

- `url` : `${slackWorkerUrl}`
- `slackWebhook` : `${slackWebhook}`
- `method` : `post`

{{< fancybox path="/img/2019/12" file="task2.png" caption="" gallery="Gallery Name" >}}

You have two options for setting the message. 

1. You can hardcode a message in the task header.
2. You can set a `message` variable in the workflow.

Either way, any field that you want replaced by a variable from the workflow should be escaped like this: `{{ variable }}`.

The templating is performed using [micromustache](https://www.npmjs.com/package/micromustache).

In the example, the message is set in the headers: `Hello {{ name }}`. When the worker receives a job, it substitutes the value of the variable `name`. If you examine the file `bpmn/test.js`, you'll see that it kicks off a workflow setting the variable `name` to "World!", leading to the Slack message "Hello World!".

## Running the demo

1. Cd into the `bpmn` directory. 
2. Run `npm i`.
3. Grab your config from your Camunda Cloud account (create Client credentials for the cluster if you don't already have some in there).
4. Run the demo like this - substituting your configuration:

```bash
ZEEBE_ADDRESS=${YOUR CLUSTER CONTACT POINT} \
ZEEBE_CLIENT_ID=${CLIENT ID} \
ZEEBE_CLIENT_SECRET=${CLIENT SECRET} \
node index.js
```