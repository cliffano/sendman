var cli = require('bagofcli');
var fsx = require('fs.extra');
var FtpDeploy = require('ftp-deploy');
var p = require('path');

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
  if (opts.file) {
    var moreOpts = JSON.parse(cli.lookupFile(opts.file));
    Object.keys(moreOpts).forEach(function (key) {
      opts[key] = moreOpts[key];
    });
  }

  if (opts.protocol === 'ftp') {
    this._ftp(opts, cb);
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
 * @param {Function} cb: standard cb(err, result) callback
 */
Sendman.prototype._ftp = function (opts, cb) {

  const DEFAULT_PORT = 21;
  const DEFAULT_PARALLEL = 10;

  // inject FtpDeploy for testing
  FtpDeploy = opts.ftpDeploy || FtpDeploy;
  delete opts.ftpDeploy;

  // add alias properties
  opts.localRoot = opts.local;
  opts.remoteRoot = opts.remote;

  // set defaults
  opts.port = opts.port || DEFAULT_PORT;
  opts.parallelUploads = opts.parallel || DEFAULT_PARALLEL;

  // remove temporary properties
  delete opts.protocol;
  delete opts.file;
  delete opts.local;
  delete opts.remote;

  // send file via FTP
  var ftpDeploy = new FtpDeploy();
  ftpDeploy.on('uploading', function(data) {
    console.log('[start] %s', data.filename);
  });
  ftpDeploy.on('uploaded', function(data) {
    console.log('[done] %s', data.filename);
  });
  ftpDeploy.deploy(opts, cb);
};

module.exports = Sendman;