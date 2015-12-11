const packageVersion = '0.0.3';
Package.describe({
  name:          'akasha:meteor-ipfs',
  version:       packageVersion,
  // Brief, one-line summary of the package.
  summary:       'run IPFS from meteor',
  // URL to the Git repository containing the source code for this package.
  git:           'https://github.com/AkashaProject/meteor-ipfs',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  'ipfs-api': '2.5.1'
});

Package.onUse(function (api) {
  api.versionsFrom('1.2.1');
  api.use('ecmascript');
  api.use('check', 'server');
  api.use('underscore', 'server');
  api.use('sanjo:long-running-child-process@1.1.3', 'server');
  api.use('akasha:fs-extra@0.26.2', 'server');
  api.use('akasha:request@2.67.0', 'server');
  api.use('akasha:shelljs@0.5.3', 'server');
  api.use('akasha:adm-zip@0.4.7', 'server');
  api.use('akasha:es6-symbol@0.0.1', 'server');
  api.use('practicalmeteor:loglevel@1.1.0_2', 'server');
  api.addFiles(['lib/ipfsConnector.js', 'lib/ipfsServerMethods.js'], 'server');
  api.export('IpfsConnector', 'server');
});

Package.onTest(function (api) {
  api.use('ecmascript');
  api.use('akasha:meteor-ipfs');
  api.use('sanjo:jasmine@0.20.3');
  api.addFiles(['tests/server/integration/ipfsConnector-spec.js'], 'server');
  api.addFiles(['tests/client/integration/ipfsMethods-spec.js'], 'client');
});
