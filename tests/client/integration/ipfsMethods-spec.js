describe('ipfs server methods', function () {

  it('can write text to ipfs', function (done) {
    Meteor.call('ipfsAdd', '{a: 1}', Meteor.bindEnvironment((err, data)=> {
      expect(err).toBeUndefined();
      expect(data).toBeDefined();
      done();
    }));

  });

  it('can read from ipfs', function (done) {
    let testText = 'test';

    Meteor.call('ipfsAdd', testText, Meteor.bindEnvironment((err, data)=> {
      if (!err) {
        Meteor.call('ipfsCat', data, Meteor.bindEnvironment((er, dat)=> {
          expect(err).toBeUndefined();
          expect(dat).toEqual(testText);
          done();
        }));
      } else {
        fail();
      }
    }));
  });
});