# Website

## Deploy changes

Configuration from [here](https://gohugo.io/hosting-and-deployment/hosting-on-github/).

Run:

```bash
./deploy.sh "commit message"
```

This will commit a build to [https://github.com/jwulf/jwulf.github.io](https://github.com/jwulf/jwulf.github.io).

GitHub pages serves it at [https://jwulf.github.io/](https://jwulf.github.io/) from there. AWS S3 points [joshwulf.com](https://joshwulf.com) to a Cloudfront distro that points to [https://jwulf.github.io/](https://jwulf.github.io/).