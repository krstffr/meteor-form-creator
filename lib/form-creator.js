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

	// Method for setting up your forms.
	// Pass an array which holds all the forms options.
	that.setupForms = function ( forms ) {

		that.forms = forms;

		// Client specific
		if (Meteor.isClient) {

			_(that.forms).each( function( form ) {
				that.setupValidatePassedForm( form );
			});

		}

		if (Meteor.isServer) {

		}

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

		// Set form values for the form
		that.setFormsValues = function ( formName, passedValues ) {

			if (!passedValues)
				throw new Error('You did not pass any passedValues to setFormsValues().');
			
			if (!formName)
				throw new Error('You did not pass any passedValues to setFormsValues().');

			var form = _(that.forms).findWhere({ name: formName });

			// If we've passed an _id, then we must create a hidden form
			// input containing it. Also we must create a delete button.
			if (passedValues._id) {

				var HTMLhiddenId = $('<input>')
				.attr('id', '_id')
				.attr('type', 'hidden')
				.val(passedValues._id);

				var HTMLdeleteBtn = $('<input>')
				.val('Delete ')
				.addClass('form-creator-btn--danger')
				.attr('onclick', 'formCreator.submitFormDelete("'+formName+'");')
				.attr('type', 'submit');

				$('#form-creator-'+formName).append(HTMLhiddenId);

				if (form.deletable !== false)
					$('#form-creator-'+formName).append(HTMLdeleteBtn);

			}

			_(form.fields).each( function( value ) {
				// We set the value to the string value (for bools!) of the value.
				// We use getObjectPropByString() to extract the value of nested objects,
				// for example 'something.something.else' inside an object.
				$('#form-creator-'+formName)
				.find('#'+ that.getFormInputIdFromName(value.name) )
				.val( that.getObjectPropByString( passedValues, value.name ).toString() );
			});

		};

		// Method for generating a form
		that.getForm = function ( formName ) {

			var form = _(that.forms).findWhere({ name: formName });

			// Blaze.renderWithData( Template['form-creator__form'], form, document.body );

			return Template['form-creator__form'];

			var HTMLcontainer = $('<div>');

			var HTMLform = $('<form>')
			.attr('onsubmit', 'formCreator.submitFormSave("'+formName+'");')
			.attr('id', 'form-creator-'+formName);

			if (typeof form.submitCallback === 'function') {
				HTMLform.attr('onsubmit', 'return formCreator.submitFormCustomCallback("'+formName+'"); return false;');
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
			.attr('for', that.getFormInputIdFromName( field.name ) );

			// A description (if provided)
			if (field.description) {

				var HTMLdescription = $('<span />')
				.text( field.description )
				.addClass('form-creator-label-description');

				HTMLlabel.append( HTMLdescription );

			}

			var elType = field.fieldType;
			var elIsInput = false;

			if ( that.inputFieldTypes.indexOf(field.fieldType) > -1 ) {
				elType = 'input';
				elIsInput = true;
			}

			// The input
			var HTMLfield = $('<'+elType+' />')
			.addClass(field.cssClass)
			.attr('required', field.required )
			.attr('disabled', field.disabled )
			.attr('pattern', field.pattern )
			.attr('id', that.getFormInputIdFromName( field.name ) )
			.attr('name', that.getFormInputIdFromName( field.name ) );

			if (field.fieldType === 'select') {
				// Append all the selectOptions
				HTMLfield.append( _(field.selectOptions).map( function( selectOption ) {
					var HTMLoption = $('<option />')
					.val( selectOption.value )
					.text( selectOption.text );
					return HTMLoption;
				}) );
			}

			if (elIsInput)
				HTMLfield.attr('type', field.fieldType );

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
			var inputs = $('#form-creator-'+formName).find('input, select');
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
				var value = $('#form-creator-'+formName).find('#'+ that.getFormInputIdFromName( formField.name ) ).val();

				// Number should be numbers
				if (formField.valType === 'number') {
					value = parseFloat( value );
				}

				// Dates should be dates
				if (formField.valType === 'date' && value)
					value = new Date( value );

				// Bools should be bools
				if (formField.valType === 'bool' && value)
					value = value == "true";

				// Add the key/value to the doc
				doc[ formField.name ] = value;

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