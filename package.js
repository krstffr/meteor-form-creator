Package.describe({
  "summary": "A form creator and validator for Meteor.js."
});

Package.onUse(function (api) {

  api.use('templating', 'client');

  api.add_files(['views/form-creator__form.html', 'views/form-creator__form.js'], 'client');
  api.add_files('lib/form-creator.js', ['client', 'server']);
  api.add_files('lib/form-creator-server-methods.js', ['server']);

  if (typeof api.export !== 'undefined') {

    // The main object.
    api.export('FormCreator', ['server', 'client']);

  }

});
