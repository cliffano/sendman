<img align="right" src="https://raw.github.com/cliffano/sendman/master/avatar.jpg" alt="Avatar"/>

[![Build Status](https://secure.travis-ci.org/cliffano/sendman.png?branch=master)](http://travis-ci.org/cliffano/sendman)
[![Dependencies Status](https://david-dm.org/cliffano/sendman.png)](http://david-dm.org/cliffano/sendman)
[![Coverage Status](https://coveralls.io/repos/cliffano/sendman/badge.png?branch=master)](https://coveralls.io/r/cliffano/sendman?branch=master)
[![Published Version](https://badge.fury.io/js/sendman.png)](http://badge.fury.io/js/sendman)
<br/>
[![npm Badge](https://nodei.co/npm/sendman.png)](http://npmjs.org/package/sendman)

Sendman
-------

Sendman is a CLI tool for sending files to a remote server.

This is handy when you want to use a configuration file to define the remote server host, port, username, password, local path, and remote path of the files you want to send.

Installation
------------

    npm install -g sendman

Usage
-----

Create a sample .sendman.json configuration file:

    sendman init

Configuration file contains:

    {
      "protocol": "ftp",
      "host": "somehost",
      "port": 21,
      "username": "someusername",
      "password": "somepassword",
      "local": "/path/to/local/dir",
      "remote": "/path/to/remote/dir",
      "parallel": 10
    }

Send the files at configured local path:

    sendman send

If .sendman.json is stored in a public SCM, it's better to store username, and password in a sub-configuration file.

.sendman.json contains:

    {
      "protocol": "ftp",
      "host": "somehost",
      "port": 21,
      "local": "/path/to/local/dir",
      "remote": "/path/to/remote/dir",
      "parallel": 10,
      "file": "/path/to/.secretSendman.json"
    }

.secretSendman.json contains:

    {
      "username": "someusername",
      "password": "somepassword"
    }