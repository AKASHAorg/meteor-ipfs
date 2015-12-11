const Future = Npm.require('fibers/future');

Meteor.methods(
  {
    ipfsCat (hash) {

      check(hash, String);
      let wrappedFiber;
      let wrappedApi;
      let ipfsStream;
      let instance     = IpfsConnector.getInstance();
      let currentChunk = new Buffer(0);

      if (!instance.api) {
        throw new Meteor.Error('ipfs-not-started', 'ipfs process is not running');
      }

      wrappedApi = Meteor.wrapAsync(instance.api.cat);
      ipfsStream = wrappedApi(hash);

      if (ipfsStream.readable) {
        wrappedFiber = new Future();
        ipfsStream.on('data', function (chunk) {
          currentChunk = Buffer.concat([currentChunk, chunk]);
        });
        ipfsStream.on('end', function () {
          wrappedFiber.return(currentChunk.toString());
        });
        ipfsStream.on('error', function (err) {
          wrappedFiber.throw(err);
        });
        return wrappedFiber.wait();
      }
      return ipfsStream;
    },

    ipfsAdd (content, isBuffer = false) {
      check(content, String);
      check(isFile, Boolean);
      let wrappedApi;
      let wrappedFiber = new Future();
      let instance     = IpfsConnector.getInstance();

      if (!instance.api) {
        return new Meteor.Error('ipfs-not-started', 'ipfs process is not running');
      }
      wrappedApi = Meteor.wrapAsync(instance.api.add);
      if (!isBuffer) {
        content = new Buffer(content);
      }

      wrappedApi(content, function (err, res) {
        if (err || !res) {
          return wrappedFiber.throw(err);
        }
        wrappedFiber.return(res[0].Hash);
      });

      return wrappedFiber.wait();
    }
  }
);