var cli = require('bagofcli');
var fsx = require('fs.extra');
var FtpDeploy = require('ftp-deploy');
var p = require('path');
var rsyncwrapper = require('rsyncwrapper');
var s3 = require('s3');
var scp2 = require('scp2');
var util = require('util');

/**
 * Class Sendman
 */
function Sendman() {
}

/**
 * Create a sample .sendman.json setup file in current working directory.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
Sendman.prototype.init = function (cb) {
  fsx.copy(p.join(__dirname, '../examples/.sendman.json'), '.sendman.json', cb);
};

/**
 * Send files with properties in a configuration file.
 *
 * @param {String} file: configuration file, default: .sendman.json
 * @param {Function} cb: standard cb(err, result) callback
 */
Sendman.prototype.send = function (file, cb) {

  const DEFAULT_PORT = 21;
  const MAX_UPLOADS = 10;

  var opts = JSON.parse(cli.lookupFile(file));

  // merge sub-configuration file
  if (opts.include) {
    var moreOpts = JSON.parse(cli.lookupFile(opts.include));
    Object.keys(moreOpts).forEach(function (key) {
      opts[key] = moreOpts[key];
    });
  }

  if (['ftp', 'scp', 'rsync', 's3'].indexOf(opts.protocol) !== -1) {
    this['_' + opts.protocol](opts, cb);
  } else {
    cb(new Error('Unsupported protocol %s', opts.protocol));
  }
};

/**
 * Send files under a local path to a remote path via FTP.
 *
 * @param {Object} opts: optional
 *   - host: hostname
 *   - port: port number, default: 21
 *   - username: username
 *   - password: password
 *   - local: local path, which files will be deployed
 *   - remote: remote path where to send the local files to
 *   - parallel: the number of files to upload in parallel, default: 10
 *   - continue: if true then continue uploading after an error, default: true
 * @param {Function} cb: standard cb(err, result) callback
 */
Sendman.prototype._ftp = function (opts, cb) {

  const DEFAULT_PORT = 21;
  const DEFAULT_PARALLEL = 10;
  const DEFAULT_CONTINUE = true;

  // add alias properties
  opts.localRoot = opts.local;
  opts.remoteRoot = opts.remote;

  // set defaults
  opts.port = opts.port || DEFAULT_PORT;
  opts.parallelUploads = opts.parallel || DEFAULT_PARALLEL;
  opts.continueOnError = opts.continue || DEFAULT_CONTINUE;

  // remove temporary properties
  delete opts.protocol;
  delete opts.include;
  delete opts.local;
  delete opts.remote;

  // send file via FTP
  var ftpDeploy = new FtpDeploy();
  ftpDeploy.on('uploaded', function(data) {
    console.log('%s (%d/%d)', data.filename, data.transferredFileCount, data.totalFileCount);
  });
  ftpDeploy.on('upload-error', function (data) {
    console.log('%s (%s)', p.join(data.relativePath, data.filename), data.err);
  });
  ftpDeploy.deploy(opts, cb);
};

/**
 * Send files under a local path to a remote S3 bucket.
 *
 * @param {Object} opts: optional
 *   - local: local path, which contains files to be deployed to S3
 *   - bucket: S3 bucket name
 *   - remote: S3 bucket prefix path
 *   - region: S3 bucket region
 *   - accessKeyId: AWS access key ID
 *   - secretAccessKey: AWS secret access key
 * @param {Function} cb: standard cb(err, result) callback
 */
Sendman.prototype._s3 = function (opts, cb) {

  var client = s3.createClient({
    s3Options: {
      accessKeyId: opts.accessKeyId,
      secretAccessKey: opts.secretAccessKey,
      region: opts.region
    }
  });

  var params = {
    deleteRemoved: true,
    localDir: opts.local,
    s3Params: {
      Bucket: opts.bucket,
      Prefix: opts.remote,
    },
  };

  var uploader = client.uploadDir(params);
  var doneFindingFiles;
  var doneFindingObjects;
  var doneMd5;
  var progressCounter = 0;

  uploader.on('progress', function () {

    // log initial statuses
    if (!doneFindingFiles && uploader.doneFindingFiles === true) {
      console.log('Found %d files', uploader.filesFound);
      doneFindingFiles = true;
    }
    if (!doneFindingObjects && uploader.doneFindingObjects === true) {
      console.log('Done finding objects');
      doneFindingObjects = true;
    }
    if (!doneMd5 && uploader.doneMd5 === true) {
      console.log('Done MD5 hashing');
      doneMd5 = true;
    }

    // log upload status
    if (progressCounter % 500 === 0 && uploader.progressAmount > 0) {
      console.log('Uploading %d/%d...', uploader.progressAmount, uploader.progressTotal);
    }

    // log delete status
    if (progressCounter % 100 === 0 && uploader.deleteAmount > 0) {
      console.log('Deleting %d/%d...', uploader.deleteAmount, uploader.deleteTotal);
    }
  });
  uploader.on('error', cb);
  uploader.on('end', function () {
    console.log('Uploaded %d/%d', uploader.progressAmount, uploader.progressTotal);
    console.log('Deleted %d/%d', uploader.deleteAmount, uploader.deleteTotal);
    cb();
  });
};

/**
 * Send files under a local path to a remote path via SCP.
 *
 * @param {Object} opts: optional
 *   - host: hostname
 *   - port: port number, default: 22
 *   - username: username
 *   - password: password
 *   - local: local path, which files will be deployed
 *   - remote: remote path where to send the local files to
 * @param {Function} cb: standard cb(err, result) callback
 */
Sendman.prototype._scp = function (opts, cb) {

  const DEFAULT_PORT = 22;

  // add alias properties
  opts.localRoot = opts.local;
  opts.remoteRoot = opts.remote;

  // set defaults
  opts.port = opts.port || DEFAULT_PORT;

  // remove temporary properties
  delete opts.protocol;
  delete opts.include;
  delete opts.local;
  delete opts.remote;

  // send file via SCP
  var remoteUrl = util.format('%s:%s@%s:%s', opts.username, opts.password, opts.host, opts.remoteRoot);
  scp2.scp(opts.localRoot, remoteUrl, cb);
};

/**
 * Send files under a local path to another local or remote path via rsync.
 * Option source or destination can either be a /path/to/file or <username>@<host>:/path/to/file
 *
 * @param {Object} opts: optional
 *   - host: hostname
 *   - username: username
 *   - password: password
 *   - local: local path, which files will be deployed
 *   - remote: remote path where to send the local files to
 *   - source: local or remote path of source file/directory to be deployed
 *   - destination: local or remote path of destination file/directory to send to
 * @param {Function} cb: standard cb(err, result) callback
 */
Sendman.prototype._rsync = function (opts, cb) {

  // use remote URL construction, handy for easy switching from SCP to rsync protocol
  if (opts.local) {

    opts.src = opts.local;
    opts.dest = util.format('%s:%s@%s:%s', opts.username, opts.password, opts.host, opts.remote);

    // remove temporary properties
    delete opts.protocol;
    delete opts.include;
    delete opts.local;
    delete opts.remote;
    delete opts.host;
    delete opts.username;
    delete opts.password;

  // use freeform source and destination locations
  } else {

    opts.src = opts.source;
    opts.dest = opts.destination;

    // remove temporary properties
    delete opts.protocol;
    delete opts.source;
    delete opts.destination;

  }

  opts.recursive = true;

  rsyncwrapper(opts, function (err, stdout, stderr, cmd) {
    console.log(cmd);
    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.error(stderr);
    }
    var result = {
      stdout: stdout,
      stderr: stderr,
      cmd: cmd
    };
    cb(err, result);
  });
};

module.exports = Sendman;
