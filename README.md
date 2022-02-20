# Manny Talk

This is generic platform, build on Node.js that routes **commands** and **messages** from voice or text-based clients to 3rd party or custom backends. Functionality is added via plugins or your own custom handlers (available when running as module).

You are looking at a monorepo for the Manny Talk project. For more details on Manny Talk and how to use it, read the core package
[readme](packages/manny-talk-core/README.MD).

# Development

The different packages can be found in `packages/`. These consist of the Manny Talk core,and plugins.

## Docker

When using the `docker-compose.yml` in the repository root, run that using: `docker-compose up`.
This will start up `npm run watch` for the `manny-talk-core` package. Open a second shell and run
`docker-compose exec node bash` to open a shell into the running container. Use
any command to perform your task.

# Contributing

Contributions are welcome. This does not necessarily have to be code, it can also be updated documentation, tutorials, bug reports or pull requests.

Please create an [issue](https://github.com/daangemist/manny-talk/issues/new/choose) to propose a feature you want to implement, so that the details can be discussed in advance.

# Similar projects

## [bottender](https://github.com/Yoctol/bottender)

This project also aims to provide a simple way to get a chatbot on multiple channels running.
The two biggest differences are that it seems to focus mostly on a standalone bottender server (it
is possible to run it as a module, but the examples did not look simple). Its missing a
HTTP API and clients/channels are hardcoded into the project and it did not seem very simple
to add a new channel without touching the core.
