Meteor.methods({
	'form-creator-save': function ( doc, formName ) {

		// The form
		var form = _(FormCreator.forms).findWhere({ name: formName });
		
		// If the form is not storeable we should stop here.
		if (!form.options.storeable)
			throw new Meteor.Error(400, 'Form is not storeable.');

		// If login is required: make sure user is logged in
		if (form.options.loginRequired && !this.userId)
			throw new Meteor.Error(400, 'You must be logged in to save data from this form: ' + formName );

		// Make sure we have a collectionName (and an actual collection!)
		var collectionName = form.collectionName;
		if (!collectionName)
			throw new Meteor.Error(400, 'No collectionName is set for form: '+formName );
		// Get the collection from the provided name
		var collection = eval(collectionName);
		if (typeof collection === 'undefined')
			throw new Meteor.Error(400, 'Collection: '+form.collectionName+' is not defined.');

		if (form.setUserId) {
			if (!this.userId)
				throw new Meteor.Error(400, 'You need to be logged in.');
			doc.userId = this.userId;
		}

		var result;

		if (doc._id)
			result = collection.update(doc._id, { $set: _(doc).omit('_id') });
		else
			result = collection.insert(doc);

		return result;

	},
	'form-creator-delete': function ( _id, formName ) {

		// The form
		var form = _(FormCreator.forms).findWhere({ name: formName });
		
		// Make sure the form is "deletable"
		if (!form.options.deletable)
			throw new Meteor.Error(400, 'Form is not deleteable!');

		// If login is required: make sure user is logged in
		if (form.options.loginRequired && !this.userId)
			throw new Meteor.Error(400, 'You must be logged in to save data from this form: ' + formName );

		// If the form is not storeable we should stop here.
		if (!form.options.storeable)
			throw new Meteor.Error(400, 'Form is not storeable.');

		var collectionName = form.collectionName;
		var collection = eval(collectionName);
		var result;

		if (form.setUserId)
			if (!this.userId)
				throw new Meteor.Error(400, 'You need to be logged in.');

		if (form.setUserId && this.userId)
			result = collection.remove({ _id: _id, userId: this.userId });
		else
			result = collection.remove({ _id: _id });

		return result;

	}
});