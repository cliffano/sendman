var bag = require('bagofcli');
var fs = require('fs');
var Sendman = require('./sendman');

function _init() {
  console.log('Creating sample configuration file: .sendman.json');
  new Sendman().init(bag.exit);
}

function _send(args, cb) {
  const DEFAULT_FILE = '.sendman.json';
  args = args || {};

  new Sendman().send(args.file || DEFAULT_FILE, bag.exit);
}

/**
 * Execute Sendman CLI.
 */
function exec() {

  var actions = {
    commands: {
      init: { action: _init },
      send: { action: _send }
    }
  };

  bag.command(__dirname, actions);
}

exports.exec = exec;