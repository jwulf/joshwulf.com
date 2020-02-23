+++
author = "Josh Wulf"
categories = ["javascript", "programming", "github"]
date = "2020-02-17"
description = "Building your own GitHub Action."
featured = "zeebe.png"
featuredalt = ""
featuredpath = "date"
linktitle = ""
title = "How to write a GitHub Action"
type = "post"

+++

GitHub Actions are small, reusable modules of functionality that can participate in GitHub Workflows. You can add a GitHub workflow yaml file to any GitHub repo, and have it run in response to events like code pushes, pull requests - even arbitrary events posted to the repository's `repository_dispatch` REST endpoint over the GitHub API.

The obvious things they can be used for are running tests, linting code or rebuilding artifacts on check-in, creating releases, even deploying from a particular branch.

## GitHub Action Usage Example 

If you have a repo with a `Dockerfile` in it, you can build the Docker image and publish it to Docker Hub using a GitHub Action ((see this workflow in a repo on GitHub](https://github.com/jwulf/camunda-cloud-demo-json-api)).

* Add a `.github/workflows/docker_publish.yml` file to your repo.

* Paste in the following content, and edit the value for `DOCKER_IMAGE_NAME`:

```
name: Docker Image CI

on: [push]
env:
  DOCKER_IMAGE_NAME: sitapati/camunda-cloud-demo-json-api

jobs:
  publish_docker:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - name: Publish Docker image to Registry
        uses: elgohr/Publish-Docker-Github-Action@2.12
        with:
          name: ${{ env.DOCKER_IMAGE_NAME }}
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
          dockerfile: Dockerfile
          tags: 'latest'
```

* Add two secrets to your repo's Secrets in the repo setting - your Docker Hub username as `DOCKER_USERNAME` and your Docker Hub password as `DOCKER_PASSWORD`.

* Push to your repository.

You will now see a workflow run in the "Actions" tab that will build the image from the Dockerfile and publish it to Docker Hub.

## But that's just the beginning

Less immediately obvious uses for GitHub Actions include building [zero-install tutorials and demos](https://github.com/jwulf/camunda-cloud-starter), and [using a GitHub repo as a JSON database](https://github.com/jwulf/ghettohub-db)! 

Creating a GitHub Action is simple. In this tutorial, I walk you through creating one. There are, broadly speaking, two types of GitHub Actions:

* **Docker**: your action pulls down a Docker image and executes something using the Docker container.
* **JavaScript**: your action runs JavaScript code.

You can also execute shell scripts, by invoking them from a JavaScript action. 

For this example, we are going to create an action that responds to a `repository_dispatch` event sent to a repo, and commits some data to the repo in response (we'll invoke a shell script for that part). This allows you to use a repo as a place to store data sent in over HTTP. I used this approach to make [GhettoHub DB](https://github.com/jwulf/ghettohub-db), a low-fi JSON Database in a GitHub repo.

## TypeScript GitHub Action Template

The easiest way to create a GitHub Action is to use the [TypeScript Action](https://github.com/actions/typescript-action) template repo. 

* Click the "Use this template" button in the GitHub web UI to fork this repo to a new repo in your GitHub account. It's a convention to put `-action` at the end of the repo name. 

* Clone the repository to your local machine.

* Install the dependencies with `npm i` (or `pnpm i` if you use [pnpm](https://pnpm.js.org/)).

Now you are ready to write your first GitHub action!

## @actions/core 

The package [`@actions/core`]() contains the basic functions for interacting with the environment: 

* `core.getInput()`
* `core.setOutput()`
* `core.info()`
* `core.error()`
* `core.setFailed()`

** Under construction: Stay tuned for more **