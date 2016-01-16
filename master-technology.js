/**********************************************************************************
 * (c) 2015-2016, Master Technology
 * Licensed under the MIT license or contact me for a Support or Commercial License
 *
 * I do contract work in most languages, so let me solve your problems!
 *
 * Any questions please feel free to email me or put a issue up on the github repo
 * Version 0.0.1                                      Nathan@master-technology.com
 *********************************************************************************/
"use strict";

/* jshint node: true, browser: true, unused: true, undef: true */
/* global android, com, java, javax, exit, UIDevice, CFAbsoluteTimeGetCurrent, NSRunLoop, NSDate */


// Load the required modules
var view = require('ui/core/view');
var frame = require('ui/frame');

// global.android is already defined on android devices
// We are defining global.ios on ios devices
if (global.NSObject && global.NSString) {
    global.ios = true;
    Object.freeze(global.ios);
}


if (!global.setImmediate) {
    global.setImmediate = global.setTimeout;
}

/***
 * Creates a Performance.now() function
 */
if (!global.Performance) {
    global.Performance = {};
}
if (!global.Performance.now) {
    if (global.android) {
        global.Performance.now = function () {
            return java.lang.System.nanoTime() / 1000000;
        };
    } else if (global.ios) {
        global.Performance.now = function() {
            return CFAbsoluteTimeGetCurrent();
        };
    }
}

/***
 * Creates a process class
 */
if (!global.process) {
    global.process = {};
}
if (!global.process.restart) {
    global.process.restart = function (msg) {
        var application = require('application');
        var dialogs= require('ui/dialogs');
        if (global.android) {
            //noinspection JSUnresolvedFunction,JSUnresolvedVariable
            var mStartActivity = new android.content.Intent(application.android.context, com.tns.NativeScriptActivity.class);
            var mPendingIntentId = parseInt(Math.random() * 100000, 10);
            //noinspection JSUnresolvedFunction,JSUnresolvedVariable
            var mPendingIntent = android.app.PendingIntent.getActivity(application.android.context, mPendingIntentId, mStartActivity, android.app.PendingIntent.FLAG_CANCEL_CURRENT);
            //noinspection JSUnresolvedFunction,JSUnresolvedVariable
            var mgr = application.android.context.getSystemService(android.content.Context.ALARM_SERVICE);
            //noinspection JSUnresolvedFunction,JSUnresolvedVariable
            mgr.set(android.app.AlarmManager.RTC, java.lang.System.currentTimeMillis() + 100, mPendingIntent);
            //noinspection JSUnresolvedFunction,JSUnresolvedVariable
            android.os.Process.killProcess(android.os.Process.myPid());
        } else if (global.ios) {
            dialogs.alert({
                title: "Please restart application",
                message: msg || "The application needs to be restarted.",
                okButtonText: "Quit!"
            }).then(function () {
                //noinspection JSUnresolvedFunction,JSHint
                exit();
            });
            return false;
        }
    };
}
if (!global.process.exit) {
    global.process.exit = function() {
        if (global.android) {
            android.os.Process.killProcess(android.os.Process.myPid());
        } else if (global.ios) {
            exit();
        }

    };
}
if (!global.process.isDebug) {
    if (global.android) {
        global.process.isDebug = function () {
            var DEBUG_PRINCIPAL = new javax.security.auth.x500.X500Principal("CN=Android Debug,O=Android,C=US");
            try {
                var signatures = this.getAppSignatures();
                var cf = java.security.cert.CertificateFactory.getInstance("X.509");
                for (var i = 0; i < signatures.length; i++) {
                    // Convert back into a Certificate
                    var stream = new java.io.ByteArrayInputStream(signatures[i].toByteArray());
                    var cert = cf.generateCertificate(stream);

                    // Get the Principal for the signing Signature
                    var SigningPrincipal = cert.getSubjectX500Principal();
                    if (SigningPrincipal.equals(DEBUG_PRINCIPAL)) {
                        this._isDebugMode = true;
                        return true;
                    }
                }
                this._isDebugMode = false;
            }
            catch (err) {
            }
            return false;
        };
    } else if (global.ios) {
        global.process.isDebug = function() {
          // TODO: At this point their doesn't seem to be an easy way to determine if the app is debuggable on iOS from the environment
          // So We will just check for if we are running on an emulator.
          // TODO: We might be able to use the ASN.1 info, see https://github.com/blindsightcorp/BSMobileProvision
          return global.process.isEmulator();
        };
    }
}
if (!global.process.isEmulator) {
    if (global.android) {
        global.process.isEmulator = function() {
            var res = android.os.Build.FINGERPRINT;
            return res.indexOf("generic") !== -1;
        };
    } else if (global.ios) {
        global.process.isEmulator = function() {
            return UIDevice.currentDevice().name.hasSuffix("Simulator");
        };
    }
}

// Thanks to the NativeScript guys (Yavor Georgiev & Georgi Atanasov) for the basis of the processMessages code
if (!global.process.processMessages) {
    if (global.android) {
        var platform = require('platform');
        var nextMethod, targetField, prepared=false;
        var sdkVersion = parseInt(platform.device.sdkVersion);

        var prepareMethods = function() {
            var clsMsgQueue = java.lang.Class.forName("android.os.MessageQueue");
            var clsMsg = java.lang.Class.forName("android.os.Message");

            var methods = clsMsgQueue.getDeclaredMethods();
            var i;
            for (i = 0; i < methods.length; i++) {
                if (methods[i].getName() === "next") {
                    nextMethod = methods[i];
                    nextMethod.setAccessible(true);
                    break;
                }
            }

            var fields = clsMsg.getDeclaredFields();
            for (i = 0; i < fields.length; i++) {
                if (fields[i].getName() === "target") {
                    targetField = fields[i];
                    targetField.setAccessible(true);
                    break;
                }
            }

            prepared = true;
        };

        global.process.processMessages = function() {
            var quit = false, counter = 0;
            if (!prepared) { prepareMethods(); }

            var queue = android.os.Looper.myQueue(), msg;
            setTimeout(function() { quit = true;}, 250);

            while (!quit ) {

                counter++;
                msg = nextMethod.invoke(queue, null);
                if (msg) {
                    var target = targetField.get(msg);
                    if (!target) {
                        quit = true;
                    } else {
                        target.dispatchMessage(msg);
                    }

                    if (sdkVersion < 21) {//https://code.google.com/p/android-test-kit/issues/detail?id=84
                        msg.recycle();
                    }
                } else {
                    quit = true;
                }
            }
        };
    } else if (global.ios) {
        global.process.processMessages = function() {
            NSRunLoop.currentRunLoop().runUntilDate(NSDate.dateWithTimeIntervalSinceNow(0.1));
        };
    }
}

if (!global.getElementById) {
    /***
     * Find a element by an id
     * @param id
     * @returns {view} or {undefined}
     */
    global.getElementById = function (id) {
        return view.getViewById(getCurrentActiveModel(), id);
    };
}

if (!view.View.prototype.getElementById) {
    /***
     * Find an element by a id
     * @param id
     * @returns {view} or {undefined}
     */
    view.View.prototype.getElementById = function (id) {
        return view.getViewById(this, id);
    };
}

if (!global.getElementsByClassName) {
    /***
     * getElementsByClassName
     * @param className - The class name
     * @returns {Array} of elements
     */
    global.getElementsByClassName = function (className) {
        return getElementsByClassName(getCurrentActiveModel(), className);
    };
}

if (!view.View.prototype.getElementsByClassName) {
    /***
     * Finds all elements with the class name
     * @param className - the Class name
     * @returns {Array} of elements
     */
    view.View.prototype.getElementsByClassName = function (className) {
        return getElementsByClassName(this, className);
    };
}

if (!global.getElementsByTagName) {
    /**
     * Finds all elements by a Tag name
     * @param tagName
     * @returns {Array}
     */
    global.getElementsByTagName = function (tagName) {
        return getElementsByTagName(getCurrentActiveModel, tagName);
    };
}

if (!view.View.prototype.getElementsByTagName) {
    /**
     * Finds all elements by a Tag name
     * @param tagName
     * @returns {Array}
     */
    view.View.prototype.getElementsByTagName = function (tagName) {
        return getElementsByTagName(this, tagName);
    };
}

if (!view.View.prototype.classList) {
    var classList = function(t) {
        var curClassList = "";
        this._resync = function() {
            if (curClassList === t.cssClass) { return; }
            var cls = t._cssClasses;
            var len = cls.length;

            // We need to zero our length; so that we can re-add anything that exists in the parent class
            this.length = 0;
            for (var i = 0; i < len; i++) {
                if (!this.contains(cls[i])) {
                    this.push(cls[i]);
                }
            }
        };
        this._update = function () {
            t.cssClass = this.join(" ");
            curClassList = t.cssClass;
        };

        this._resync();
    };
    classList.prototype = [];
    classList.prototype.toString = function() {
        this._resync();
        return this.join(" ");
    };
    classList.prototype.item = function(i) {
        this._resync();
        return this[i] || null;
    };
    classList.prototype.add = function() {
        this._resync();
        var updated=false;
        for (var i=0,len=arguments.length;i<len;i++) {
            if (!this.contains(arguments[i])) {
                this.push(arguments[i]);
                updated = true;
            }
        }
        if (updated) {
            this._update();
        }
        return this;
    };
    classList.prototype.remove = function() {
        this._resync();
        var updated = false;
        for (var i= 0,len=arguments.length;i<len;i++) {
            var idx = this.indexOf(arguments[i]);
            if (idx >= 0) {
                this.splice(idx, 1);
                updated = true;
            }
        }
        if (updated) {
            this._update();
        }
        return this;
    };
    classList.prototype.toggle = function(val, force) {
        this._resync();
        if (this.contains(val)) {
            if (force === true) { return this; }
            return this.remove(val);
        } else {
            if (force === false) { return this; }
            return this.add(val);
        }
    };
    classList.prototype.contains = function(c) {
            return this.indexOf(c) >= 0;
    };
    var getClassList = function (val) {
        var cl = new classList(val);
        Object.defineProperty(val, "classList", { value: cl, configurable: true, enumerable: true });
        return cl;
    };
    Object.defineProperty(view.View.prototype, "classList", {configurable: true, enumerable: true, get: function() { return getClassList(this); }});
}


/*** Support routines, not publicly accessible ***/
function getElementsByClassName(v, clsName) {
    var retVal=[];
    if (!v) {
        return retVal;
    }

    if (v._cssClasses && v._cssClasses.length && v._cssClasses.indexOf(clsName) !== -1) {
        retVal.push(v);
    }

    var classNameCallback = function (child) {
        if (child._cssClasses && child._cssClasses.length && child._cssClasses.indexOf(clsName) !== -1) {
            retVal.push(child);
        }
        return true;
    };

    view.eachDescendant(v, classNameCallback);
    return retVal;
}

function getElementsByTagName(v, tagName) {
    var retVal=[];
    if (!v) {
        return retVal;
    }

    if (v.typeName && v.typeName === tagName) {
        retVal.push(v);
    }

    var tagNameCallback = function (child) {
        if (child.typeName === tagName) {
            retVal.push(child);
        }
        return true;
    };

    view.eachDescendant(v, tagNameCallback);
    return retVal;
}

var getCurrentActiveModel = function() {
    var topFrame = frame.topmost();
    var model = topFrame.currentPage && topFrame.currentPage.model;
    if (model) { return model; }
    return topFrame;
};
