var buster = require('buster-node');
var cli = require('bagofcli');
var fsx = require('fs.extra');
var FtpDeploy = require('ftp-deploy');
var proxyquire = require('proxyquire');
var referee = require('referee');
var rsyncwrapper = require('rsyncwrapper');
var s3 = require('s3');
var scp2 = require('scp2');
var Sendman = require('../lib/sendman');
var assert = referee.assert;

buster.testCase('sendman - init', {
  'should copy sample couchpenter.js file to current directory when init is called': function (done) {
    this.mock({});
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
    var data = { protocol: 'ftp', include: '.sub.sendman.json' };
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
  },
  'should send file via AWS S3 when protocol is s3': function (done) {
    var data = { protocol: 's3' };
    this.mockCli.expects('lookupFile').once().withExactArgs('.sendman.json').returns(JSON.stringify(data));
    var sendman = new Sendman();
    sendman._s3 = function (opts, cb) {
      assert.equals(opts.protocol, 's3');
      cb();
    };
    sendman.send('.sendman.json', function (err) {
      assert.equals(err, undefined);
      done();
    });
  },
  'should send file via scp when protocol is scp': function (done) {
    var data = { protocol: 'scp' };
    this.mockCli.expects('lookupFile').once().withExactArgs('.sendman.json').returns(JSON.stringify(data));
    var sendman = new Sendman();
    sendman._scp = function (opts, cb) {
      assert.equals(opts.protocol, 'scp');
      cb();
    };
    sendman.send('.sendman.json', function (err) {
      assert.equals(err, undefined);
      done();
    });
  },
  'should send file via rsync when protocol is rsync': function (done) {
    var data = { protocol: 'rsync' };
    this.mockCli.expects('lookupFile').once().withExactArgs('.sendman.json').returns(JSON.stringify(data));
    var sendman = new Sendman();
    sendman._rsync = function (opts, cb) {
      assert.equals(opts.protocol, 'rsync');
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
    this.mockConsole.expects('log').once().withExactArgs('%s (%d/%d)', 'some/path/somefile', 6, 10);
    this.mockConsole.expects('log').once().withExactArgs('%s (%s)', 'some/path/somefile', 'some error');
    function on(event, cb) {
      if (event === 'uploaded') {
        cb({
          relativePath: 'some/path',
          filename: 'somefile',
          transferredFileCount: 6,
          totalFileCount: 10
        });
      } else if (event === 'upload-error') {
        cb({
          relativePath: 'some/path',
          filename: 'somefile',
          err: 'some error'
        });
      }
    }
    function deploy(opts, cb) {
      assert.equals(opts.protocol, undefined);
      assert.equals(opts.include, undefined);
      assert.equals(opts.local, undefined);
      assert.equals(opts.remote, undefined);
      assert.equals(opts.host, 'somehost');
      assert.equals(opts.port, 21);
      assert.equals(opts.parallelUploads, 10);
      assert.equals(opts.localRoot, 'somelocalpath');
      assert.equals(opts.remoteRoot, 'someremotepath');
      cb();
    }

    var mockFtpDeploy = function () {
      return { on: on, deploy: deploy };
    };
    var Sendman = proxyquire('../lib/sendman', { 'ftp-deploy': mockFtpDeploy });
    var sendman = new Sendman();

    var opts = { protocol: 'ftp', host: 'somehost', local: 'somelocalpath', remote: 'someremotepath' };
    sendman._ftp(opts, done);
  }
});

buster.testCase('sendman - s3', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockS3 = this.mock(s3);
  },
  'should upload objects': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('Uploading %d/%d...', 23, 88);
    this.mockConsole.expects('log').once().withExactArgs('Deleting %d/%d...', 3, 10);
    this.mockConsole.expects('log').once().withExactArgs('Uploaded %d/%d', 23, 88);
    this.mockConsole.expects('log').once().withExactArgs('Deleted %d/%d', 3, 10);
    var mockUploader = {
      progressAmount: 23,
      progressTotal: 88,
      deleteAmount: 3,
      deleteTotal: 10,
      doneFindingFiles: false,
      doneFindingObjects: false,
      doneMd5: false,
      on: function (event, cb) {
        if (event === 'progress') {
          cb();
        } else if (event === 'end') {
          cb();
        }
      }
    };
    var mockClient = {
      uploadDir: function (params) {
        assert.equals(params.deleteRemoved, true);
        assert.equals(params.localDir, 'somelocalpath');
        assert.equals(params.s3Params.Bucket, 'somebucket');
        assert.equals(params.s3Params.Prefix, 'someremotepath');
        return mockUploader;
      }
    };
    this.mockS3.expects('createClient').once().withArgs({ s3Options: { accessKeyId: 'someaccesskeyid', secretAccessKey: 'somesecretaccesskey', region: 'ap-southeast-2' }}).returns(mockClient);
    var opts = { bucket: 'somebucket', local: 'somelocalpath', remote: 'someremotepath', accessKeyId: 'someaccesskeyid', secretAccessKey: 'somesecretaccesskey', region: 'ap-southeast-2' };
    var sendman = new Sendman();
    sendman._s3(opts, done);
  },
  'should display expected messages at the start of the progress': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('Found %d files', 88);
    this.mockConsole.expects('log').once().withExactArgs('Done finding objects');
    this.mockConsole.expects('log').once().withExactArgs('Done MD5 hashing');
    this.mockConsole.expects('log').once().withExactArgs('Uploaded %d/%d', 0, 88);
    this.mockConsole.expects('log').once().withExactArgs('Deleted %d/%d', 0, 10);
    var mockUploader = {
      filesFound: 88,
      progressAmount: 0,
      progressTotal: 88,
      deleteAmount: 0,
      deleteTotal: 10,
      doneFindingFiles: true,
      doneFindingObjects: true,
      doneMd5: true,
      on: function (event, cb) {
        if (event === 'progress') {
          cb();
        } else if (event === 'end') {
          cb();
        }
      }
    };
    var mockClient = {
      uploadDir: function (params) {
        assert.equals(params.deleteRemoved, true);
        assert.equals(params.localDir, 'somelocalpath');
        assert.equals(params.s3Params.Bucket, 'somebucket');
        assert.equals(params.s3Params.Prefix, 'someremotepath');
        return mockUploader;
      }
    };
    this.mockS3.expects('createClient').once().withArgs({ s3Options: { accessKeyId: 'someaccesskeyid', secretAccessKey: 'somesecretaccesskey', region: 'ap-southeast-2' }}).returns(mockClient);
    var opts = { bucket: 'somebucket', local: 'somelocalpath', remote: 'someremotepath', accessKeyId: 'someaccesskeyid', secretAccessKey: 'somesecretaccesskey', region: 'ap-southeast-2' };
    var sendman = new Sendman();
    sendman._s3(opts, done);
  }
});

buster.testCase('sendman - scp', {
  setUp: function () {
    this.mockScp2 = this.mock(scp2);
  },
  'should set opts for scp module': function (done) {
    this.mockScp2.expects('scp').once().withArgs('somelocalpath', 'someusername:somepassword@somehost:someremotepath').callsArgWith(2);
    var opts = { protocol: 'scp', host: 'somehost', local: 'somelocalpath', remote: 'someremotepath', username: 'someusername', password: 'somepassword' };
    var sendman = new Sendman();
    sendman._scp(opts, done);
  }
});

buster.testCase('sendman - rsync', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockRsyncwrapper = this.mock(rsyncwrapper);
  },
  'should set opts for rsync module with source and destination properties': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('rsync some/source/path some/destination/path');
    this.mockConsole.expects('log').once().withExactArgs('somestdout');
    this.mockRsyncwrapper.expects('rsync').once().withArgs({ src: 'some/source/path', dest: 'some/destination/path', recursive: true }).callsArgWith(1, null, 'somestdout', null, 'rsync some/source/path some/destination/path');
    var opts = { protocol: 'rsync', source: 'some/source/path', destination: 'some/destination/path' };
    var sendman = new Sendman();
    sendman._rsync(opts, done);
  },
  'should set opts for rsync module with local and remote properties': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('rsync somelocalpath someusername:somepassword@somehost:someremotepath');
    this.mockConsole.expects('error').once().withExactArgs('somestderr');
    this.mockRsyncwrapper.expects('rsync').once().withArgs({ src: 'somelocalpath', dest: 'someusername:somepassword@somehost:someremotepath', recursive: true }).callsArgWith(1, null, null, 'somestderr', 'rsync somelocalpath someusername:somepassword@somehost:someremotepath');
    var opts = { protocol: 'rsync', host: 'somehost', local: 'somelocalpath', remote: 'someremotepath', username: 'someusername', password: 'somepassword' };
    var sendman = new Sendman();
    sendman._rsync(opts, done);
  }
});
