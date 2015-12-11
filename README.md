## This package:
 * Exports a global class named `IpfsConnector` available only on **server**
 * Downloads ipfs binaries
 * Can start ipfs process
 * Can send commands  to [ipfs api](https://ipfs.io/docs/api/) server

## Example

 * On server side create a global variable just before `Meteor.startup`:

   ```javascript
	// for global access on server side
	ipfsObj = false;

	const testIpfs = function () {
	  // start ipfs daemon
	  let started = ipfsObj.start();
	  // wait for process to start
	  if (started) {
	    // test api calls https://www.npmjs.com/package/ipfs-api
	    ipfsObj.api.add(new Buffer('random stuff'), (err, data)=> {
	      console.log('ipfs hash ' + data[0].Hash);
	    });
	  }
	};

	Meteor.startup(function () {
	  ipfsObj          =  IpfsConnector.getInstance(); //singleton
	  ipfsObj.setLogLevel('info'); // info is default
	  testIpfs();
	});
   ```
 * Available IpfsConnector methods:

 ```javascript
 start(); // start ipfs daemon
 stop();
 setLogLevel('*'); // one of ['trace', 'fine', 'debug', 'info', 'warn', 'error']
 api.*; // access ipfs-api https://www.npmjs.com/package/ipfs-api
 ```
 * Server methods for client

 ```
 Meteor.call('ipfsCat',[ipfsHash], function(err,resp){ ... // get contents from ipfs hash
  Meteor.call('ipfsAdd',[string or ArrayBuffer, boolean to signal ArrayBuffer], function(err,resp){ ... // upload
  contents to ipfs
 ```

 * Test this package:

 ```javascript
 VELOCITY_TEST_PACKAGES=1 meteor test-packages --driver-package velocity:html-reporter akasha:meteor-ipfs
 ```
