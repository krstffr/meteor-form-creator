FormCreator = function () {
	
	var that = this;

	/* 
		// Required fields
		*/

	// The required fields
	that.requiredFields = ['name', 'fields'];
	// The required field-fields
	that.requiredFieldFields = ['name', 'fieldType', 'label'];
	

	/* 
		// Valid values for various fields
		*/

	// The valid field types
	that.validFieldTypes = ['text', 'textarea', 'select', 'number', 'date', 'password'];
	// The valid types of fields.X.valType
	that.validFieldValTypes = ['string', 'number', 'date'];


	// FormCreator.forms holds all forms.
	that.forms = [];

	// Shared methods

	// Method for finding out if an array is duplicate free or not
	// Returns bool
	that.arrayDuplicateFree = function (arr) {
		var dupFree = true;
		arr.sort();
		var last = arr[0];
		for (var i=1; i<arr.length; i++) {
			if (arr[i] == last) dupFree = false;
			last = arr[i];
		}
		return dupFree;
	};

	// Method for setting up your forms.
	// Pass an array which holds all the forms options.
	that.setupForms = function ( forms ) {

		console.log('this should be on both server and client.');

		that.forms = forms;

		// Client specific
		if (Meteor.isClient) {

			_(that.forms).each( function( form ) {
				that.setupValidatePassedForm( form );
			});

			console.log('that.setupForms() on client.');

		}

		if (Meteor.isServer) {
			console.log('that.setupForms() on server.');
		}

	};

	// Client methods
	if (Meteor.isClient) {

		// Validate passed forms (in setup)
		that.setupValidatePassedForm = function ( form ) {

			// Validate the "highest" level of the form

			var passedFormKeys = _(form).keys();
			var missingKeys = _( that.requiredFields ).difference( passedFormKeys );
			if ( missingKeys.length !== 0 )
				throw new Error('You must pass ' + missingKeys);

			
			// Validate the fields

			// Make sure we don't have two fields with the same name
			var fieldNames = _(form.fields).pluck('name');
			if (!that.arrayDuplicateFree( fieldNames ))
				throw new Error('You have duplicate name values in your form fields: ' + fieldNames );

			_(form.fields).each( function( field ) {

				// Make sure every field has the correct keys
				var fieldKeys = _(field).keys();
				var missingKeys = _( that.requiredFieldFields ).difference( fieldKeys );
				if ( missingKeys.length !== 0 )
					throw new Error('You must pass ' + missingKeys + '. You passed: ' + fieldKeys );

				// Make sure every field has a correct type
				if ( !_( that.validFieldTypes ).contains( field.fieldType ) )
					throw new Error('Field type is not valid: ' + field.fieldType + '. \n OK types: ' + that.validFieldTypes );

				// Make sure every field has a correct valType
				if (field.valType && !_( that.validFieldValTypes ).contains( field.valType ) )
					throw new Error('Field type is not valid: ' + field.valType  + '. \n OK types: ' + that.validFieldValTypes );

			});

			return true;

		};

		// Set form values for the form
		that.setFormsValues = function ( formName, values ) {

			if (!values)
				throw new Error('You did not pass any values to setFormsValues().');
			
			if (!formName)
				throw new Error('You did not pass any values to setFormsValues().');

			// If we've passed an _id, then we must create a hidden form
			// input containing it. Also we must create a delete button.
			if (values._id) {

				var HTMLhiddenId = $('<input>')
				.attr('id', '_id')
				.attr('type', 'hidden')
				.val(values._id);

				var HTMLdeleteBtn = $('<input>')
				.val('Delete ')
				.addClass('form-creator-btn--danger')
				.attr('onclick', 'formCreator.submitFormDelete("'+formName+'");')
				.attr('type', 'submit');

				$('#form-creator-'+formName).append(HTMLhiddenId, HTMLdeleteBtn);

			}

			_(values).each( function( value, key ) {
				$('#form-creator-'+formName).find('#'+key).val(value);
			});

		};

		// Method for generating a form
		that.getForm = function ( formName ) {

			var form = _(that.forms).findWhere({ name: formName });

			var HTMLcontainer = $('<div>');

			var HTMLform = $('<form>')
			.attr('onsubmit', 'formCreator.submitFormSave("'+formName+'");')
			.attr('id', 'form-creator-'+formName);

			if (typeof form.submitCallback === 'function') {
				HTMLform.attr('onsubmit', 'formCreator.submitFormCustomCallback("'+formName+'");')
			}

			var HTMLheadline = $('<h2>')
			.text(form.name);

			var HTMLsubmitBtn = $('<input>')
			.val('Save '+form.name)
			.addClass('form-creator-btn--success')
			.attr('type', 'submit');

			var HTMLfield;

			_(form.fields).each( function( field ) {
				HTMLfield = that.getFormField( field );
				HTMLform.append(HTMLfield);
			});

			HTMLform.prepend(HTMLheadline);
			HTMLform.append(HTMLsubmitBtn);
			
			HTMLcontainer.append(HTMLform);

			return HTMLcontainer.html();

		};

		// Generate a form field
		// Returns a <div /> containing a label and an input
		that.getFormField = function ( field ) {

			// This is a container div for the label and the input
			var HTMLfieldGroup = $('<div />');

			// If it's a required field we'll add a special class for this
			// This class can be used for CSS styling of the label/input
			if (field.required)
				HTMLfieldGroup.addClass('form-creator-required-group');

			// The label
			var HTMLlabel = $('<label />')
			.text(field.label)
			.attr('for', field.name);

			// The input
			var HTMLfield = $('<input />')
			.addClass(field.cssClass)
			.attr('type', field.fieldType )
			.attr('type', field.fieldType )
			.attr('required', field.required )
			.attr('id', field.name);

			// Here everything is added to the container div
			HTMLfieldGroup.append(HTMLlabel);
			HTMLfieldGroup.append(HTMLfield);

			// The container div is returned
			return HTMLfieldGroup;

		};


		// Method for executing custom submit callback
		that.submitFormCustomCallback = function ( formName ) {
			
			// The form which is setup by the user.
			var form = _(that.forms).findWhere({ name: formName });

			// Get all input values
			var inputs = $('#form-creator-'+formName).find('input');
			var inputValues = {};
			_(inputs).each( function( input ) {
				inputValues[ $(input).attr('id') ] = $(input).val();
			});

			form.submitCallback( inputValues );

		};

		// Method for submitting the form (save/update)
		that.submitFormSave = function ( formName ) {

			// The form which is setup by the user.
			var form = _(that.forms).findWhere({ name: formName });

			// If the form is not storeable we should stop here.
			if (!form.storeable)
				throw new Error('Form is not storeable.');

			// The doc which will be saved.
			var doc = {};

			// Loop over every form field and store it's value in the doc var
			_(form.fields).each( function( formField ) {

				// Store the value from the DOM
				var value = $('#form-creator-'+formName).find('#'+formField.name).val();

				// Number should be numbers
				if (formField.valType === 'number') {
					value = parseFloat( value );
					console.log(typeof value);
				}

				// Dates should be dates
				if (formField.valType === 'date' && value)
					value = new Date( value );

				// Add the key/value to the doc
				doc[ formField.name ] = value || false;

			});

			// If we've got an _id input, get it as well
			var _id = $('#form-creator-'+formName).find('#_id').val();
			if (_id)
				doc._id = _id;

			// Save the doc
			Meteor.call('form-creator-save', doc, formName, function (err, res) {
				// Output any errors
				if (err) {
					throw new Error('Something went wrong: ', err );
				} else {
					// If the user has attached a saveCallback, call it (and pass the result)
					if (typeof form.saveCallback === 'function') {
						form.saveCallback(res);
					}
				}
			});
			
		};

		that.submitFormDelete = function ( formName ) {
			
			// The form which is setup by the user.
			var form = _(that.forms).findWhere({ name: formName });

			// If the form is not storeable we should stop here.
			if (!form.storeable)
				throw new Error('Form is not "deleteable".');

			// If we've got an _id input, get it as well
			var _id = $('#form-creator-'+formName).find('#_id').val();
			if (!_id)
				throw new Error('Form is not "deleteable".');

			// Delete the doc
			Meteor.call('form-creator-delete', _id, formName, function (err, res) {
				// Output any errors
				if (err) {
					throw new Error('Something went wrong: ', err );
				} else {
					// If the user has attached a saveCallback, call it (and pass the result)
					if (typeof form.deleteCallback === 'function') {
						form.deleteCallback(res);
					}
				}
			});

		};

	}

	// Server methods
	if (Meteor.isServer) {

	}

};