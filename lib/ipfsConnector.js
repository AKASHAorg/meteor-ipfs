const binariesVersion = '0.3.9_';
const path            = Npm.require('path');
const ipfsAPI         = Npm.require('ipfs-api');
const Future          = Npm.require('fibers/future');
const exec            = Npm.require('child_process').exec;
const writeJson       = Meteor.wrapAsync(Fse.outputJson);

const device     = process.platform + '-' + process.arch;
const projectDir = process.env.PWD + '/';
const homeDir    = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

const assetsDir  = '.private';
const configFile = 'ipfs.json';
const execPath   = path.join(projectDir, assetsDir);

const ipfsFolder = 'ipfs';
const ipfsRoot   = path.join(execPath, ipfsFolder);
const assetsRoot = 'https://gobuilder.me/get/github.com/ipfs/go-ipfs/cmd/ipfs/ipfs_v' + binariesVersion;

const log = loglevel.createPackageLogger('akasha:meteor-ipfs', defaultLevel = 'info');
const logLevels = ['trace', 'fine', 'debug', 'info', 'warn', 'error'];

const binaries = {
  'linux-arm':  assetsRoot + 'linux-arm.zip',
  'linux-ia32': assetsRoot + 'linux-386.zip',
  'linux-x64':  assetsRoot + 'linux-amd64.zip',
  'darwin-x64': assetsRoot + 'darwin-amd64.zip',
  'win32-ia32': assetsRoot + 'windows-386.zip',
  'win32-x64':  assetsRoot + 'windows-amd64.zip'
};

const symbolEnforcer = Symbol();
const symbol         = Symbol();

IpfsConnector = class IpfsConnector {

  constructor (enforcer) {
    if (enforcer !== symbolEnforcer) {
      throw new Meteor.Error('singleton-enforce', 'Cannot construct singleton');
    }
    this.ipfsConnector = false;
    this.config        = false;
    this.api           = false;
    this.sock          = '/ip4/127.0.0.1/tcp/5001';
    this.ipsProcess    = new LongRunningChildProcess('ipfsProcess');
    this.executable    = path.join(ipfsRoot, ((process.platform == 'win32') ? 'ipfs.exe' : 'ipfs'));
  }

  static getInstance () {
    if (!this[symbol]) {
      this[symbol] = new IpfsConnector(symbolEnforcer);
    }
    return this[symbol];
  }

  /**
   * start ipfs
   * @returns {*}
   */
  start () {
    if (!this.ipfsConnector) {
      const future = new Future();
      let config   = this._checkConfig();
      if (config) {
        let options = {
          command: this.executable,
          args:    ['daemon']
        };
        log.info('starting ipfs daemon from ' + this.executable);
        this.ipfsConnector = this.ipsProcess.spawn(options);
        Meteor.setTimeout(()=> {
          this.api = ipfsAPI(this.sock);
          log.info('connecting to ipfsAPI on ' + this.sock);
          future.return(true);
        }, 4000);

      } else {
        log.error('error getting ipfs config');
        future.throw(true);
      }
      return future.wait();
    }
    return true;
  }

  /**
   *
   * @returns {*|any}
   * @private
   */
  _checkConfig () {
    const future = new Future();
    Fse.stat(path.join(execPath, configFile), Meteor.bindEnvironment((err, stats)=> {
      if (!stats) {
        let hasAssets = this._getAssets(true);
        if (hasAssets) {
          let init = this._init();
          if (init) {
            this._writeToConfig();
            future.return(true);
          } else {
            log.error('could not init ipfs');
            future.throw(true);
          }
        } else {
          log.error('could not download ipfs');
          future.throw(true);
        }
      } else {
        Fse.readJson(path.join(execPath, configFile), Meteor.bindEnvironment((er, config)=> {
          if (er) {
            future.throw(er);
          } else {
            this.config   = config;
            let hasAssets = this._getAssets();
            if (hasAssets) {
              this._writeToConfig();
              let init = this._init();
              if (init) {
                future.return(true);
              } else {
                future.throw(false);
              }
            } else {
              future.return(true);
            }
          }
        }));
      }
    }));
    return future.wait();
  }

  /**
   * run <code>ipfs init</code>
   * @returns {*|any}
   * @private
   */
  _init () {
    const future = new Future();
    let q        = exec(this.executable + ' init');

    q.on('exit', (code)=> {
      future.return(true);
    });

    q.on('error', (err)=> {
      future.throw(err);
    });
    return future.wait();
  }

  /**
   * donwload and unzip ipfs
   * @param force
   * @returns {boolean}
   * @private
   */
  _getAssets (force = false) {
    let hasInit = this._checkIpfsConfig();
    if (!hasInit) {
      force = true;
    }
    if (force || (this.config.version != binariesVersion)) {
      const zipPath = path.join(execPath, 'ipfs-' + binariesVersion + '.zip');
      const future  = new Future();

      Shelljs.mkdir('-p', ipfsRoot);

      const file = Fse.createWriteStream(zipPath);
      Request.get(binaries[device]).on('response', function (response) {

        /** nice message for download **/
        if (response.statusCode == 200) {
          log.info('====Started to download IPFS binaries===');
        }
      }).on('error', function (error) {

        log.error('!!!Could not download IPFS binaries!!!');
        future.throw('could not download IPFS');
      }).pipe(file).on('finish', ()=> {
        log.info('====download completed...unzipping files...====');

        /** extract .zip contents to .private/ipfs **/
        let zip = new AdmZip(zipPath);
        zip.extractAllTo(execPath);

        /** just to be sure that ipfs is executable **/
        Shelljs.chmod('+x', path.join(ipfsRoot,
          ((process.platform == 'win32') ? 'ipfs.exe' : 'ipfs')));
        log.info('finished');
        this._delZip();
        future.return(true);
      });
      return future.wait();
    }
    return false;
  }

  /**
   * write current ipfs version
   * @private
   */
  _writeToConfig () {
    writeJson(path.join(execPath, configFile), {version: binariesVersion}, Meteor.bindEnvironment((error)=> {
      if (error) {
        log.error('could not write to ipfs.json');
      } else {
        this.config = {version: binariesVersion};
      }
    }));
  }

  /**
   * check if <code>ipfs init</code>
   * @returns {*|any}
   * @private
   */
  _checkIpfsConfig () {
    const future = new Future();
    Fse.stat(path.join(homeDir, '.ipfs/config'), Meteor.bindEnvironment((err, stats)=> {
      if (err) {
        future.return(false);
      } else {
        future.return(true);
      }
    }));
    return future.wait();
  }

  stop () {
    this._kill();
    this.ipfsConnector = false;
  }

  /**
   * kill child process & cleanup
   * @private
   */
  _kill () {
    this.ipfsProcess.kill();
  }

  /**
   * delete ipfs archives
   * @private
   */
  _delZip () {
    Shelljs.rm('-rf', path.join(execPath, 'ipfs-*.zip'));
  }

  /**
   *
   * @param level from $logLevels
   */
  setLogLevel (level = 'info') {
    if (logLevels.indexOf(level) != -1) {
      log.setLevel(level);
    } else {
      log.error('level not from logLevels ', logLevels);
    }
  }
};