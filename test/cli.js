var buster = require('buster-node');
var _cli = require('bagofcli');
var cli = require('../lib/cli');
var referee = require('referee');
var Sendman = require('../lib/sendman');
var assert = referee.assert;

buster.testCase('cli - exec', {
  'should contain commands with actions': function (done) {
    var mockCommand = function (base, actions) {
      assert.defined(base);
      assert.defined(actions.commands.init.action);
      assert.defined(actions.commands.send.action);
      done();
    };
    this.mock({});
    this.stub(_cli, 'command', mockCommand);
    cli.exec();
  }
});

buster.testCase('cli - init', {
  setUp: function () {
    this.mockConsole = this.mock(console);
  },
  'should contain init command and delegate to Sendman init when exec is called': function (done) {
    this.mockConsole.expects('log').withExactArgs('Creating sample configuration file: .sendman.json');
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands.init.action();
    });
    this.stub(Sendman.prototype, 'init', function (cb) {
      assert.equals(typeof cb, 'function');
      done();
    });
    cli.exec();
  }
});

buster.testCase('cli - send', {
  setUp: function () {
    this.mockProcess = this.mock(process);
  },
  'should use custom config file when arg is provided': function () {
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands.send.action({
        file: '.somesendman.json'
      });
    });
    this.stub(Sendman.prototype, 'send', function (file, cb) {
      assert.equals(file, '.somesendman.json');
      cb();
    });
    cli.exec();
  },
  'should use default config file when arg is not provided': function () {
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands.send.action();
    });
    this.stub(Sendman.prototype, 'send', function (file, cb) {
      assert.equals(file, '.sendman.json');
      cb();
    });
    cli.exec();
  }
});
