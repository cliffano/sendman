<img align="right" src="https://raw.github.com/cliffano/sendman/master/avatar.jpg" alt="Avatar"/>

[![Build Status](https://img.shields.io/travis/cliffano/sendman.svg)](http://travis-ci.org/cliffano/sendman)
[![Dependencies Status](https://img.shields.io/david/cliffano/sendman.svg)](http://david-dm.org/cliffano/sendman)
[![Coverage Status](https://coveralls.io/repos/cliffano/sendman/badge.png?branch=master)](https://coveralls.io/r/cliffano/sendman?branch=master)
[![Published Version](https://badge.fury.io/js/sendman.png)](http://badge.fury.io/js/sendman)
<br/>
[![npm Badge](https://nodei.co/npm/sendman.png)](http://npmjs.org/package/sendman)

Sendman
-------

Sendman is a CLI tool for sending files to a local/remote location.

This is handy when you want to use a configuration file to define the local/remote server host, port, username, password, local path, and remote path of the files you want to send via FTP, SCP, or rsync. No more retyping lengthy commands one by one.

Installation
------------

    npm install -g sendman

Usage
-----

Create a sample .sendman.json configuration file:

    sendman init

Configuration file contains:

    {
      "protocol": "scp",
      "host": "somehost",
      "port": 22,
      "username": "someusername",
      "password": "somepassword",
      "local": "/path/to/local/dir",
      "remote": "/path/to/remote/dir"
    }

Send the files located at `local` path to `remote` location:

    sendman send

It's possible to include sub-configuration file.

.sendman.json contains:

    {
      "protocol": "ftp",
      "host": "somehost",
      "port": 21,
      "local": "/path/to/local/dir",
      "remote": "/path/to/remote/dir",
      "parallel": 10,
      "include": "/path/to/.secretSendman.json"
    }

.secretSendman.json contains:

    {
      "username": "someusername",
      "password": "somepassword"
    }

Alternatively, you can use rsync to send files to a remote host.

    {
      "protocol": "rsync",
      "host": "somehost",
      "local": "/path/to/local/dir",
      "remote": "/path/to/remote/dir"
    }

rsync can also be used to send files between local paths.

    {
      "protocol": "rsync",
      "source": "/path/to/local/dir1",
      "destination": "/path/to/local/dir2"
    }

Colophon
--------

[Developer's Guide](http://cliffano.github.io/developers_guide.html#nodejs)

Build reports:

* [Code complexity report](http://cliffano.github.io/sendman/bob/complexity/plato/index.html)
* [Unit tests report](http://cliffano.github.io/sendman/bob/test/buster.out)
* [Test coverage report](http://cliffano.github.io/sendman/bob/coverage/buster-istanbul/lcov-report/lib/index.html)
* [Integration tests report](http://cliffano.github.io/sendman/bob/test-integration/cmdt.out)
* [API Documentation](http://cliffano.github.io/sendman/bob/doc/dox-foundation/index.html)
