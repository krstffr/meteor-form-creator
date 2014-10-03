form-creator
===================

This is a form creator for Meteor.js.


## Installing

```meteor add krstffr:form-creator```


## Example app

There is an example app in the [https://github.com/krstffr/meteor-form-creator/tree/master/example/form-creator-example](/example/form-creator-example) directory.

http://form-creator.meteor.com


## Still in the early stages!

This package is under development and should probably not be considered safe to use just yet.


## Usage

There are two different usage scenarios for this package:

1. Creating a form where all the fields you define for the form are stored in a MongoDB collection.
2. Creating a form where you provide your own callback for the form (where you have access to all the field values and can do to them whatever you like).


### Scenario 1: Where you want to store the data from a form in a MongoDB collection

When you've installed the package there'll be a ```FormCreator``` object available on the client and the server. 

Start by defining an array of all the forms you want on both the client and server, then pass it to the ```FormCreator.setupForms( forms )``` method. This will create (and validate) all the forms you've defined, and you can now get them in your HTML by using the ```{{> formCreatorForm 'formName' }}``` helper. This get's the form with the name 'formName' from the forms you passed to the ```setupForms()``` method.

But let's first look at how you define your forms. Let's first create an empty array where you store all your forms.

```javascript
// An array for storing all of our forms.
var forms = [];
```

Now let's create a very basic form for storing blog posts with only two inputs: **title** and **content**.

```javascript
// Make sure we have a collection defined where we store the data
BlogPosts = new Meteor.Collection('blogPosts');

// A very simple blogPost form
var blogPostForm = {

  // name: This is the name of the form.
  // The name is used for outputting the form in the HTML, using this helper:
  // {{> formCreatorForm 'blogPostForm' }}
  name: 'blogPostForm',

  // description: The description is optional, and will be displayed above the form (if you want it to)
  description: 'This is a form for creating and updating blogPosts.',

  // collectionName: The name of the collection where you want to save the form data.
  collectionName: 'BlogPosts',

  // fields: An array of all the form inputs
  fields: [{

    // name: The name of the form input. This will also be the stored key in the DB.
    name: 'title',

    // fieldType: What type is this input?
    // The valid types are: 'text', 'textarea', 'select', 'number', 'date', 'password'
    fieldType: 'text',
	
    // label: This will be displayed as a <label> above the input
    label: 'The title of the blog post',
		
  },
  {
    name: 'content',
    fieldType: 'textarea',
    label: 'The blog post content'
  }],

  // options: The options object contains various options for the form
  options: {

    // storeable: If false then you won't be able to save data to the DB
    storeable: true,

    // Do you also want to be able to delete documents?
    deletable: true

  }
};
```

Now push the form to the forms-array and pass the forms-array to the ```FormCreator.setupForms( forms );``` method.

```javascript
FormCreator.setupForms( forms );
```

And finally, let's output the form to our HTML:
```HTML
{{> formCreatorForm 'blogPostForm' }}
```

Now you'll see your form in you HTML and you should be able to save blog posts to your DB!


#### More options

##### Creating a select input

```javascript
// Add an object like this to the form.fields array
{
  name: 'rating',

  // fieldType: 'select'; 
  //This will make the input a <select>
  fieldType: 'select',

  label: 'How good do you think this blog post is?',

  // selectOptions: Here are the <options> for the <select>
  // value: this is the actual value which will be stored
  // text: this is the text the user sees in the <option>
  selectOptions: [
  { value: 5, text: '5/5: BRILLIANT!' },
  { value: 4, text: '4/5: Good.' },
  { value: 3, text: '3/5: OK' },
  { value: 2, text: '2/5: Needs work.' },
  { value: 1, text: '1/5: WTF is this rubbish!!?' }
  ]
}
```

##### Creating a required object which should be a number

```javascript
// Add an object like this to the form.fields array
{
  name: 'someNumber',
  fieldType: 'number',
  label: 'Please give us a number',

  // This will make the input only accept numbers
  valType: 'number',

  // This will make the input required
  required: true
}
```

##### Some options for the form

```javascript
options: {

  // storeable: Makes the form storable in the DB.
  storeable: true,

  // deletable: Gives the user the ability to remove documents
  deletable: true,

  // showTitle: The form will display the name of the form as a headline at the top
  showTitle: true,

  // showDescription: The form description will be shown below the title
  showDescription: true,

  // textButtonSave: Allows you to give the "Save" button to have a custom text.
  textButtonSave: 'Publish blog post',

  // textButtonUpdate: Allows you to give the "Update" button to have a custom text.
  textButtonUpdate: 'Update blog post',

  // textButtonDelete: Allows you to give the "Delete" button to have a custom text.
  textButtonDelete: 'Remove blog post 4-ever!',

  // textButtonCancel: Allows you to give the "Cancel" button to have a custom text.
  textButtonCancel: 'I don\'t want to update this blog post',

}
```

##### Updating an existing doc

If you want to update an existing document, pass the document and the formName to the ```FormCreator.updateDocInForm( doc, formName );``` method. Maybe you have a button below every blog post which set's this up like this:

```javascript
Template.blogPost.events({
  'click .edit-link': function ( e ) {
    FormCreator.updateDocInForm( this, 'blogPostForm' );
  }
});
```

Now the form will show the document in the form and the Update/Delete/Cancel buttons will be displayed.

See the example app for how this could look.


### Scenario 2: Where you provide your own callback

It might be wise to check out scenario 1 before trying this.

All you need to do to handle the form submissions yourself is to provide a ```submitCallback: fn()``` to the form you create. See example which will just ```alert();``` the value of the alertThis text input.

```javascript
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
    // From this callback, all the values which the user has
    // passed from the form are available in the values object.
    // Just use the name of the input to get the value
    return alert( values.alertThis );
  }
};
```

Of course, from within the callback you can do whatever crazy stuff you feel like, like calling methods on the server which you've defined or do whatever.
