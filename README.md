# nativescript-master-technology
A class of generic functions that are useful in NativeScript

## License

This is released under the MIT License, meaning you are free to include this in any type of program -- However for entities that need a support contract, changes, enhancements and/or a commercial license please contact me (nathan@master-technology.com).

## Updates

Please feel free to fork this repo and add other utility functions!!!


## Installation 
  
Copy the repo's 'master-technology.js' file into your app folder.


## Usage

To use the  module you must first `require()` it:

```js
require( "./master-technology.js" );
```
 
### Methods

#### setImmediate(<function>);

#### Performance.now()
Returns the current time stamp in NS or MS (depends on the platform)

#### Process.restart()
IOS will tell the user they need to restart; and then exit.  (Apple doesn't appear to have any "restart" app ability)
Android will quit and restart the app.

#### Process.exit()
Exit the application

#### Process.isDebug()
Detects if you are running the debug version of the code on Android, on ios it returns Process.isEmulator()

#### Process.isEmulator()
Detects if you are running on an emulator

#### processMessages()
A Syncronous method to cause IOS & Android to handle their message loops.  

#### getElementById(id)
#### getElementsByClassName(className)
#### getElementsByTagName(tagName)
Like there Web DOM counterparts; returns elements based on the critera.

#### view.getElementById(id)
#### view.getElementsByClassName(className)
#### view.getElementsByTagName(tagName)
Like there Web DOM counterparts; returns the children elements based on the critera.

#### view.classList.add(className)
Add a class to the view's class list

#### view.classList.remove(className)
Removes a class from the view's class list

#### view.classList.toggle(className[, force])
Toggles a class name
if force = true, will force adding the class name only.
if force = false, will force removing the class name only.

#### view.classList.item(id) 
Returns the class name at that location.

#### view.classList.contains(className)
Returns true or false if the class name exists in the class list.




