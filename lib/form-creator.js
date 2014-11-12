FormCreatorHandler = function () {
	
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
	// The types which generate an <input>
	that.inputFieldTypes = ['text', 'date', 'password', 'number'];
	// The valid types of fields.X.valType
	that.validFieldValTypes = ['string', 'number', 'date', 'bool'];


	// FormCreator.forms holds all forms.
	that.forms = [];

	// Shared methods

	// Method for getting nested values in an object by string
	that.getObjectPropByString = function( o, s ) {
		s = s.replace(/\[(\w+)\]/g, '.$1');  // convert indexes to properties
		s = s.replace(/^\./, ''); // strip leading dot
		var a = s.split('.');
		while (a.length) {
			var n = a.shift();
			if (n in o) {
				o = o[n];
			} else {
				// Return an empty string if nothing matches.
				// TODO FIX: Can this be harmful?
				return '';
			}
		}
		return o;
	};


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

	// Add options key to all forms if they don't already have it
	that.validateOptionsInForms = function ( forms ) {
		return _(forms).map( function( form ) {
			// Add .options if the var isn't set already
			if (!form.options)
				form.options = {};

			// Make sure it's an object as well.
			check(form, Object);

			return form;

		});
	};

	// Method for setting up your forms.
	// Pass an array which holds all the forms options.
	that.setupForms = function ( forms ) {

		// Client specific
		if (Meteor.isClient) {

			_(forms).each( function( form ) {
				that.setupValidatePassedForm( form );
			});

		}

		if (Meteor.isServer) {

		}

		// Add options key to all forms if they don't already have it
		forms = that.validateOptionsInForms( forms );

		that.forms.push( forms );

	};

	// Client methods
	if (Meteor.isClient) {

		that.getFormInputIdFromName = function ( name ) {
			return name.replace(/\./g, '-');
		};

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

		// Method for getting the defined form from the formName
		that.getForm = function ( formName ) {
			return _( that.forms ).findWhere({ name: formName });
		};

		that.getFieldId = function ( fieldContext, formName ) {
			return 'form-creator__'+formName+'__'+fieldContext.name;
		};

		that.getPreparedInputs = function ( formName ) {

			// Get the form (and the inputs)
			var form = FormCreator.getForm( formName );
			var inputs = form.fields;

			// Here's where we store the actual values (which are returned from this method)
			var inputValues = {};

			// Iterate over all the inputs
			_(inputs).each( function( input ) {

				// Store the value from the DOM in the value var
				var value = $('#' + that.getFieldId( input, formName ) ).val();

				// If the value is required and the value is not there, throw an error
				if (input.required && value.length < 1)
					throw new Error( input.name + ' is required but not set!');

				// Number should be numbers
				if (input.valType === 'number' && value) {
					if (isNaN(value))
						throw new Error( input.name + ' is not a number, is: ' + typeof value );
					value = parseFloat( value );
				}

				// Dates should be dates
				if (input.valType === 'date' && value)
					value = new Date( value );

				// Bools should be bools
				if (input.valType === 'bool' && value)
					value = value == "true";

				// Add the key/value to the doc
				inputValues[ input.name ] = value;

			});

			// Return the prepared values!
			return inputValues;

		};

		that.cancelDocUpdate = function () {
			Session.set('form-creator__doc-to-update', false );
		};

		// Method for setting a doc to update to a form
		that.updateDocInForm = function ( doc, formName ) {
			var form = FormCreator.getForm( formName );
			if (!form)
				throw new Error('There is no form with name: ' + formName );
			doc.formName = formName;
			Session.set('form-creator__doc-to-update', doc );
		};

		that.submitDeleteDocMethod = function ( formName ) {

			var idToDelete = $('#form-creator__'+ formName +'__id-to-update').val();
			if (!idToDelete)
				throw new Error('Can\'t find _id for document to remove! _id is: ' + idToDelete );

			// Get the form
			var form = FormCreator.getForm( formName );

			// Make sure user is logged in if that's required
			if (form.options.loginRequired && !Meteor.user())
				throw new Error('You must be logged in to submit data from this form: ' + formName );

			Meteor.call('form-creator-delete', idToDelete, formName, function (err, res) {
				// Output any errors
				if (err)
					throw new Error('Something went wrong when trying to delete document: ' + err.reason );
			});

		};

		that.submitSaveMethod = function ( formName, action ) {

			// Get the prepared (numbers are numbers, dates are dates) inputs from the DOM
			var inputValues = FormCreator.getPreparedInputs( formName );

			// Get the form
			var form = FormCreator.getForm( formName );

			// Make sure user is logged in if that's required
			if (form.options.loginRequired && !Meteor.user())
				throw new Error('You must be logged in to submit data from this form: ' + formName );

			// If there is a callback provided by the user, execute it!
			if (form.submitCallback)
				return form.submitCallback( inputValues );

			if (action === 'update') {
				inputValues._id = $('#form-creator__'+ formName +'__id-to-update').val();
				if (!inputValues._id)
					throw new Error('Can\'t find _id for document to update! _id is: ' + inputValues._id );
			}
			
			Meteor.call('form-creator-save', inputValues, formName, function (err, res) {
				// Output any errors
				if (err)
					throw new Error('Something went wrong when trying to save document: ' + err.reason );
			});

		};

		that.resetForm = function ( formName ) {
			// Reset any docs which are currently about to be updated
			that.cancelDocUpdate();
			// Reset the DOM form
			var formInDom = $('.form-creator__form__'+ formName );
			formInDom[0].reset();
		};

	}

	// Server methods
	if (Meteor.isServer) {

	}

};

FormCreator = new FormCreatorHandler();