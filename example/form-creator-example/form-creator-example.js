BlogPosts = new Meteor.Collection('blogPosts');

if (Meteor.isServer)
  Meteor.publish('allBlogPosts', function () { return BlogPosts.find({}, { sort: { publishDate: -1 }, limit: 10 }); });

if (Meteor.isClient) {
  Meteor.subscribe('allBlogPosts');
  Template.savingData.helpers({
    blogPosts: function () {
      if (!BlogPosts.findOne())
        return [{ title: 'No posts yet!', blogPostContent: 'Add some blog posts using the form to the left.' }];
      return BlogPosts.find();
    },
    publishDate: function () {
      var thisDate = new Date( this.publishDate );
      return thisDate.getFullYear() + '/' + (thisDate.getMonth()+1) + '/' + thisDate.getDate();
    }
  });
  Template.savingData.events({
    'click .edit-link': function ( e ) {
      FormCreator.updateDocInForm( this, 'blogPostForm' );
    }
  });
  Template.customCallbacks.helpers({
    someSessionData: function () {
      return Session.get('someSession') || [{ text: 'No data yet!', color: '#999' }];
    }
  });
}

// An array for storing all of our forms.
var forms = [];

// A form object! This will become a form which we can get using
// the {{> getForm 'blogPostForm' }} helper.
var blogPostForm = {
  name: 'blogPostForm',
  description: 'This is a form for creating and updating blogPosts.',
  collectionName: 'BlogPosts',
  fields: [{
    name: 'title',
    fieldType: 'text',
    label: 'The title of the blog post',
    valType: 'string',
    required: true
  },
  {
    name: 'publishDate',
    fieldType: 'date',
    label: 'Publish date',
    valType: 'date',
    required: true
  },
  {
    name: 'blogPostContent',
    fieldType: 'textarea',
    label: 'The actual content',
    valType: 'string',
    required: true
  },
  {
    name: 'rating',
    fieldType: 'select',
    valType: 'number',
    label: 'How good do you think this blog post is?',
    selectOptions: [
    { value: 5, text: '5/5: BRILLIANT!' },
    { value: 4, text: '4/5: Good.' },
    { value: 3, text: '3/5: OK' },
    { value: 2, text: '2/5: Needs work.' },
    { value: 1, text: '1/5: WTF is this rubbish!!?' }
    ]
  }],
  options: {
    storeable: true,
    deletable: true,
    showTitle: true,
    showDescription: true,
    textButtonSave: 'Publish blog post',
    textButtonUpdate: 'Update blog post',
    textButtonDelete: 'Remove blog post 4-ever!',
    textButtonCancel: 'I don\'t want to update this doc',
  }
};

var formWithCustomCallback1 = {
  name: 'customCallbackForm1',
  description: 'A form which does not store data.',
  fields: [{
    name: 'alertThis',
    fieldType: 'text',
    label: 'Alert this!',
    valType: 'string',
    required: true
  }],
  options: {
    storeable: false,
    deletable: false,
    showTitle: false,
    showDescription: true,
    textButtonSave: 'ALERT!',
  },
  submitCallback: function ( values ) {
    return alert('A L E R T: ' + values.alertThis );
  }
};

var formWithCustomCallback2 = {
  name: 'customCallbackForm2',
  description: 'A form which adds two numbers.',
  fields: [{
    name: 'num1',
    fieldType: 'number',
    label: 'Add this',
    valType: 'number',
    required: true
  },
  {
    name: 'num2',
    fieldType: 'number',
    label: 'with this number',
    valType: 'number',
    required: true
  }],
  options: {
    storeable: false,
    deletable: false,
    showTitle: false,
    showDescription: true,
    textButtonSave: 'Add those numbers!',
  },
  submitCallback: function ( values ) {
    return alert('Sum: ' + ( values.num1 + values.num2 ) );
  }
};

var formWithCustomCallback3 = {
  name: 'customCallbackForm3',
  description: 'A form which adds things to a list below.',
  fields: [{
    name: 'text',
    fieldType: 'text',
    label: 'Add this text to the list',
    required: true
  },
  {
    name: 'color',
    fieldType: 'select',
    label: 'The color of the list item',
    required: true,
    selectOptions: [
    { value: '#f00', text: 'Red' },
    { value: '#0f0', text: 'Green' },
    { value: '#00f', text: 'Blue' }
    ]
  }],
  options: {
    storeable: false,
    deletable: false,
    showTitle: false,
    showDescription: true,
    textButtonSave: 'Add value to the list below.',
  },
  submitCallback: function ( values ) {
    var currentSession = Session.get('someSession') || [];
    var newListItem = { text: values.text, color: values.color };
    currentSession.push( newListItem );
    Session.set('someSession', currentSession);
  }
};

forms.push( blogPostForm );
forms.push( formWithCustomCallback1 );
forms.push( formWithCustomCallback2 );
forms.push( formWithCustomCallback3 );

FormCreator.setupForms( forms );