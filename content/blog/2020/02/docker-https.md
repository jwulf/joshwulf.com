+++
author = "Josh Wulf"
categories = ["docker", "deployment"]
date = "2020-02-17"
description = "Run multiple webapps on a single host with automated SNI and TLS certificate provisioning."
featured = "docker-letsencrypt-schema.png"
featuredalt = ""
featuredpath = "date"
linktitle = ""
title = "Easily run multiple apps with HTTPS using Docker and LetsEncrypt"
type = "post"

+++

I frequently deploy Web APIs in Docker. On a single VM I might have up to five or six services running.
All of them have TLS certificates and are accessible via port 443 using SNI — Server Name Indication, where the request is routed to the correct backend based on the domain name of the request.

This is very easy to set up using [letsencrypt-nginx-sidecar](https://github.com/jwulf/letsencrypt-nginx-sidecar), (which builds on [this project](https://github.com/JrCs/docker-letsencrypt-nginx-proxy-companion) and [this project](https://github.com/jwilder/nginx-proxy)).

This approach is super-quick to set up and use, and reliable — I’ve been using it for a couple of years now, with no issues. It uses an nginx reverse proxy that listens to a Docker network. When a container joins the Docker network, the nginx reverse proxy adds an entry to route requests to it, and a companion container contacts LetsEncrypt to automatically provision a certificate for TLS connections to that domain.
Setting it up is easy.

## Set up

* Git clone the repo:

```
git clone https://github.com/jwulf/letsencrypt-nginx-sidecar.git
```

* Now create a Docker network for your containers:

```
docker network create letsencrypt
```

* Start the nginx proxy and LetsEncrypt companion:

```
cd sidecar && docker-compose up -d
```

That’s it! You can now deploy multiple webapps to this host using docker-compose and have them automatically proxied with TLS.

You have a proxy running that can route requests to your webapps based on the domain name of the request, and which will automatically get (and renew) a certificate for TLS as you add new webapps.

## Adding a web app

Any time you want to add another web app to this network:

* First set up the DNS record for the domain to point to the host machine’s external interface.

* In the `docker-compose.yml` file for the webapp, add the following environment variables:

```
environment:
  # Set to the port that your webapp listens on
  VIRTUAL_PORT=3000
  # Can be comma-separated list
  VIRTUAL_HOST=mysubdomain.mydomain.com 
  # The domain for the cert, can also be comma-separated
  LETSENCRYPT_HOST=mysubdomain.mydomain.com
  # Your email for the cert
  LETSENCRYPT_EMAIL=me@gmail.com
```

* Add a networks entry to have your webapp join the `letsencrypt` network:

```
networks:
  default:
    external:
      name: letsencrypt
```

Thats it!

Your webapp container will join the network, and the proxy and companion containers will do the rest.

Your webapp container does not need to map any ports in the `docker-compose.yml` file. The nginx proxy handles all external communication and routes requests over the Docker network.

You can see an example of a complete `docker-compose.yml` file in [this repo](https://github.com/jwulf/camunda-cloud-demo-json-api/blob/master/deploy/docker-compose.yml).
