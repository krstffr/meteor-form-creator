Package.describe({
  summary: "A form creator for Meteor.js.",
  version: "0.1.4",
  git: "https://github.com/krstffr/meteor-form-creator",
  name: "krstffr:form-creator"
});

Package.onUse(function (api) {

	api.versionsFrom("METEOR@0.9.0");

  api.use('templating', 'client');

  api.add_files(['views/form-creator__form.html', 'views/form-creator__form.js'], 'client');
  api.add_files('lib/form-creator.js', ['client', 'server']);
  api.add_files('lib/form-creator-server-methods.js', ['server']);

  // The main object.
  api.export('FormCreator', ['server', 'client']);

});
