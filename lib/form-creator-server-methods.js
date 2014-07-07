Meteor.methods({
	'form-creator-save': function ( doc, formName ) {

		// The form
		var form = _(formCreator.forms).findWhere({ name: formName });
		
		// If the form is not storeable we should stop here.
		if (!form.storeable)
			throw new Error('Form is not storeable.');

		var collectionName = form.collectionName;
		var collection = eval(collectionName);
		var result;

		if (form.setUserId) {
			if (!this.userId)
				throw new Meteor.Error(400, 'You need to be logged in.');
			doc.userId = this.userId;
		}

		if (doc._id)
			result = collection.update(doc._id, { $set: _(doc).omit('_id') });
		else
			result = collection.insert(doc);

		return result;

	},
	'form-creator-delete': function ( _id, formName ) {

		// The form
		var form = _(formCreator.forms).findWhere({ name: formName });
		
		// If the form is not storeable we should stop here.
		if (!form.storeable)
			throw new Error('Form is not storeable.');

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