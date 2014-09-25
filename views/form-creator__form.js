var templateName = 'form-creator__form';
var getForm = function ( context ) {
	return _( formCreator.forms ).findWhere({ name: context.formName });
};
var getFieldId = function ( fieldContext, formContext) {
	return 'form-creator__'+formContext.formName+'__'+fieldContext.name;
};

Template[templateName].rendered = function () {

	if (!this.data.formName)
		throw new Error('No formName provided!');

	if (!getForm( this.data ))
		throw new Error('No form with name: ' + this.data.formName);

};

Template[templateName].helpers({
	getFieldId: function ( formContext ) {
		return getFieldId( this, formContext );
	},
	fields: function () {
		var form = getForm( this );
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

Template[templateName].events({
	'submit form': function ( e, tmpl ) {
		e.preventDefault();
		var that = this;
		var form = getForm( this );
		var inputs = form.fields;
		var inputValues = {};
		_(inputs).each( function( input ) {
			inputValues[ input.name ] = $('#' + getFieldId( input, that ) ).val();
		});
		if (form.submitCallback)
			return form.submitCallback( inputValues );
	}
});