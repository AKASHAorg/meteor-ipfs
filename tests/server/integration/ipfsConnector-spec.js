describe('IpfsConnector', function () {
  let ipfsObj;
  beforeAll(function () {
    ipfsObj = IpfsConnector.getInstance();
  });

  it('can init ipfs connector', function () {
    expect(ipfsObj).toBeDefined();
  });

  it('can start ipfs process', function (done) {
    if (ipfsObj.start()) {
      expect(ipfsObj.ipsProcess).toBeDefined();
      expect(ipfsObj.ipfsConnector).toBe(true);
      expect(ipfsObj.api).not.toBe(false);
      expect(ipfsObj.executable).toBeDefined();
      expect(ipfsObj.config).not.toBe(false);

      done();
    }
  }, 5000);

  it('can add', function (done) {
    let bufferText = new Buffer('{}');
    if (ipfsObj.start()) {
      ipfsObj.api.add(bufferText, Meteor.bindEnvironment(function (err, resp) {
        expect(err).toBe(null);
        expect(resp[0].Hash).toBeDefined();
        done();
      }));

    }
  }, 1000);

  it('can read', function (done) {
    let ipfsHash = 'QmbJWAESqCsf4RFCqEY7jecCashj8usXiyDNfKtZCwwzGb';
    if (ipfsObj.start()) {
      ipfsObj.api.cat(ipfsHash, Meteor.bindEnvironment(function (err, resp) {
        expect(err).toBe(null);
        expect(resp.readable).toBe(true);
        done();
      }));
    }
  }, 1000);

});