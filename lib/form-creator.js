FormCreator = function () {
	
	var that = this;

	/* 
		// Required fields
		*/

	// The required fields
	that.requiredFields = ['name', 'collectionName', 'fields'];
	// The required field-fields
	that.requiredFieldFields = ['name', 'fieldType', 'label'];
	

	/* 
		// Valid values for various fields
		*/

	// The valid field types
	that.validFieldTypes = ['text', 'textarea', 'select', 'number', 'date'];
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

		// Client specific
		if (Meteor.isClient) {

			_(forms).each( function( form ) {
				that.setupValidatePassedForm( form );
			});

			that.forms = forms;

			console.log('that.setupForms() on client.');

		}
		if (Meteor.isServer) {
			console.log('this should be on server.');
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
			// input containing it
			if (values._id) {
				var HTMLhiddenId = $('<input>')
				.attr('id', '_id')
				.attr('type', 'hidden')
				.val(values._id);
				$('#form-creator-'+formName).append(HTMLhiddenId);
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
			.attr('id', 'form-creator-'+formName);
			var HTMLheadline = $('<h2>').text(form.name);
			var HTMLsubmitBtn = $('<input>').attr('type', 'submit');
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
		that.getFormField = function ( field ) {

			var HTMLfieldGroup = $('<div />');

			var HTMLlabel = $('<label />')
			.text(field.label)
			.attr('for', field.name);

			var HTMLfield = $('<input />')
			.addClass(field.cssClass)
			.attr('type', field.fieldType )
			.attr('type', field.fieldType )
			.attr('required', field.required )
			.attr('id', field.name);

			HTMLfieldGroup.append(HTMLlabel);
			HTMLfieldGroup.append(HTMLfield);

			return HTMLfieldGroup;

		};

	}

	// Server methods
	if (Meteor.isServer) {

	}

};