# nativescript-master-technology
A library of generic functions that are useful in NativeScript

## License

This is released under the MIT License, meaning you are free to include this in any type of program -- However for entities that need a support contract, changes, enhancements and/or a commercial license please contact me (nathan@master-technology.com).

## Updates

Please feel free to fork this repo and add other utility functions!!!


## Installation 
  
tns plugin add nativescript-master-technology

## Notes:

The first release of this library had a ton of DOM routines, these have been moved to there own plugin called 'nativescript-dom'


## Usage

To use the  module you must first `require()` it:

```js
require( "nativescript-master-technology" );
```

 All routines are global; you do not need to keep a reference to the library.

### Methods

#### setImmediate(<function>);
Push this task off to the next available time slice.

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

#### Process.processMessages()
A Syncronous method to cause IOS & Android to handle their message loops.  

#### console.keys()
Prints out all the keys in the object