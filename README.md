<img align="right" src="https://raw.github.com/cliffano/sendman/master/avatar.jpg" alt="Avatar"/>

[![Build Status](https://img.shields.io/travis/cliffano/sendman.svg)](http://travis-ci.org/cliffano/sendman)
[![Dependencies Status](https://img.shields.io/david/cliffano/sendman.svg)](http://david-dm.org/cliffano/sendman)
[![Coverage Status](https://img.shields.io/coveralls/cliffano/sendman.svg)](https://coveralls.io/r/cliffano/sendman?branch=master)
[![Published Version](https://img.shields.io/npm/v/sendman.svg)](http://www.npmjs.com/package/sendman)
<br/>
[![npm Badge](https://nodei.co/npm/sendman.png)](http://npmjs.org/package/sendman)

Sendman
-------

Sendman is a CLI tool for sending files to a local/remote location.

This is handy when you want to use a configuration file to define the local/remote server host, port, username, password, local path, and remote path of the files you want to send via FTP, SCP, rsync, or AWS S3. No more retyping lengthy commands one by one.

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

To send files to an AWS S3 bucket:

    {
      "protocol": "s3",
      "local": "/path/to/local/dir",
      "bucket": "somebucket",
      "region": "ap-southeast-2",
      "remote": "/path/to/bucket/prefix",
      "accessKeyId": "someaccesskeyid",
      "secretAccessKey": "somesecretaccesskey"
    }

Colophon
--------

[Developer's Guide](http://cliffano.github.io/developers_guide.html#nodejs)

Build reports:

* [Code complexity report](http://cliffano.github.io/sendman/complexity/plato/index.html)
* [Unit tests report](http://cliffano.github.io/sendman/test/buster.out)
* [Test coverage report](http://cliffano.github.io/sendman/coverage/buster-istanbul/lcov-report/lib/index.html)
* [Integration tests report](http://cliffano.github.io/sendman/test-integration/cmdt.out)
* [API Documentation](http://cliffano.github.io/sendman/doc/dox-foundation/index.html)
