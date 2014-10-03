Template.formCreatorForm.rendered = function () {

	if (!this.data)
		throw new Error('No formName passed to formCreatorForm template!');

	if (!FormCreator.getForm( this.data ))
		throw new Error('No form with name: ' + this.data);

};

Template.formCreatorForm.helpers({
	formName: function () {
		return this.toString();
	},
	selectOptionIsSelected: function ( key ) {
		// Helper for checking if a option>select is the same as the saved documents value
		if (!Session.get('form-creator__doc-to-update') || !Session.get('form-creator__doc-to-update')[key])
			return ;
		var savedValue = Session.get('form-creator__doc-to-update')[key];
		if( this.value === savedValue )
			return 'selected';
	},
	docToUpdate: function () {
		// Helper for returning the current doc to update (if it's for this form!)
		if (!Session.get('form-creator__doc-to-update'))
			return false;
		var formName = this.toString();
		if ( Session.get('form-creator__doc-to-update').formName !== formName )
			return false;
		return Session.get('form-creator__doc-to-update');
	},
	getDocToUpdateValue: function ( key ) {
		if (!Session.get('form-creator__doc-to-update') || !Session.get('form-creator__doc-to-update')[key])
			return ;
		// Get the value from the session.
		var valueToReturn = Session.get('form-creator__doc-to-update')[key];
		if( this.fieldType === 'date') {
			// This is for handling dates.
			// We need to format the date exactly the way HTML5 want's it, which is like: 2017-03-04.
			var dateToReturn = new Date( valueToReturn );
			valueToReturn = dateToReturn.getFullYear() +
			'-' + ('0' + (dateToReturn.getMonth()+1) ).slice(-2) +
			'-' + ('0' + dateToReturn.getDate() ).slice(-2);
		}
		return valueToReturn;
	},
	options: function () {
		var formName = this.toString();
		var form = FormCreator.getForm( formName );
		return form.options;
	},
	getFormProperty: function ( key ) {
		var formName = this.toString();
		var form = FormCreator.getForm( formName );
		if (form[ key ])
			return form[ key ];
		return key + 'is not set';
	},
	getFieldId: function ( formContext ) {
		return FormCreator.getFieldId( this, formContext );
	},
	fields: function () {
		var formName = this.toString();
		var form = FormCreator.getForm( formName );
		if (!form)
			return ;
		return form.fields;
	},
	fieldTypeIs: function ( fieldType ) {
		if (fieldType === 'input')
			return ['text', 'number', 'date', 'password'].indexOf( this.fieldType ) > -1;
		return this.fieldType == fieldType;
	},
	isRequired: function ( returnType ) {
		
		if (!this.required)
			return ;
		
		if (returnType === 'boolean')
			return true;

		return 'required';

	}
});

var handleSubmit = function ( e, tmpl ) {

	e.preventDefault();

	var submitButton = $( e.currentTarget );
	if (submitButton.length < 1)
		submitButton = $( tmpl.find('input[type="submit"]') );
	var submitAction = submitButton.data('submit-action');
	var formName = this.toString();

	if (submitAction === 'delete-doc')
		FormCreator.submitDeleteDocMethod( formName );

	if (submitAction === 'cancel-update')
		FormCreator.cancelDocUpdate();

	if (submitAction === 'save-doc')
		FormCreator.submitSaveMethod( formName, 'save' );

	if (submitAction === 'update-doc')
		FormCreator.submitSaveMethod( formName, 'update' );

	FormCreator.resetForm( formName );

	return ;

};

Template.formCreatorForm.events({
	'submit form': handleSubmit,
	'click input[type="submit"]': handleSubmit
});