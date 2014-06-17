Package.describe({
  "summary": "A form creator and validator for Meteor.js."
});

Package.on_use(function (api) {

  api.use('templating', 'client');

  api.add_files('lib/form-creator.js', ['client', 'server']);

  if (typeof api.export !== 'undefined') {

    // The main object.
    api.export('FormCreator', ['server', 'client']);

  }

});
