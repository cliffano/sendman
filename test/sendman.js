var buster = require('buster-node');
var cli = require('bagofcli');
var fsx = require('fs.extra');
var FtpDeploy = require('ftp-deploy');
var referee = require('referee');
var Sendman = require('../lib/sendman');
var assert = referee.assert;

buster.testCase('sendman - init', {
  'should copy sample couchpenter.js file to current directory when init is called': function (done) {
    this.stub(fsx, 'copy', function (src, dest, cb) {
      assert.isTrue(src.match(/\/examples\/.sendman.json$/).length === 1);
      assert.equals(dest, '.sendman.json');
      cb();
    });
    var sendman = new Sendman();
    sendman.init(function (err, result) {
      assert.equals(err, undefined);
      done();
    });
  }
});

buster.testCase('sendman - send', {
  setUp: function () {
    this.mockCli = this.mock(cli);
  },
  'should pass error when protocol is unsupported': function (done) {
    var data = { protocol: 'inexistingprotocol' };
    this.mockCli.expects('lookupFile').once().withExactArgs('.sendman.json').returns(JSON.stringify(data));
    var sendman = new Sendman();
    sendman.send('.sendman.json', function (err) {
      assert.equals(err.message, 'Unsupported protocol %s', 'inexistingprotocol');
      done();
    });
  },
  'should merge sub-configuration file when specified in main configuration file': function (done) {
    var data = { protocol: 'ftp', file: '.sub.sendman.json' };
    var subData = { foo: 'bar' };
    this.mockCli.expects('lookupFile').once().withExactArgs('.sendman.json').returns(JSON.stringify(data));
    this.mockCli.expects('lookupFile').once().withExactArgs('.sub.sendman.json').returns(JSON.stringify(subData));
    var sendman = new Sendman();
    sendman._ftp = function (opts, cb) {
      assert.equals(opts.protocol, 'ftp');
      assert.equals(opts.foo, 'bar');
      cb();
    };
    sendman.send('.sendman.json', function (err) {
      assert.equals(err, undefined);
      done();
    });
  },
  'should send file via ftp when protocol is ftp': function (done) {
    var data = { protocol: 'ftp' };
    this.mockCli.expects('lookupFile').once().withExactArgs('.sendman.json').returns(JSON.stringify(data));
    var sendman = new Sendman();
    sendman._ftp = function (opts, cb) {
      assert.equals(opts.protocol, 'ftp');
      cb();
    };
    sendman.send('.sendman.json', function (err) {
      assert.equals(err, undefined);
      done();
    });
  }
});

buster.testCase('sendman - ftp', {
  setUp: function () {
    this.mockConsole = this.mock(console);
  },
  'should set opts for ftp module': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('[start] %s', 'somefile');
    this.mockConsole.expects('log').once().withExactArgs('[done] %s', 'somefile');
    function on(event, cb) {
      cb({ filename: 'somefile' });
    }
    function deploy(opts, cb) {
      assert.equals(opts.protocol, undefined);
      assert.equals(opts.file, undefined);
      assert.equals(opts.local, undefined);
      assert.equals(opts.remote, undefined);
      assert.equals(opts.host, 'somehost');
      assert.equals(opts.port, 21);
      assert.equals(opts.parallelUploads, 10);
      assert.equals(opts.localRoot, 'somelocalpath');
      assert.equals(opts.remoteRoot, 'someremotepath');
      cb();
    }
    var ftpDeploy = function () {
      return { on: on, deploy: deploy };
    };
    var opts = { protocol: 'ftp', host: 'somehost', local: 'somelocalpath', remote: 'someremotepath', ftpDeploy: ftpDeploy };
    var sendman = new Sendman();
    sendman._ftp(opts, done);
  }
});