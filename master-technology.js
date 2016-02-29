/**********************************************************************************
 * (c) 2015-2016, Master Technology
 * Licensed under the MIT license or contact me for a Support or Commercial License
 *
 * I do contract work in most languages, so let me solve your problems!
 *
 * Any questions please feel free to email me or put a issue up on the github repo
 * Version 0.0.2                                      Nathan@master-technology.com
 *********************************************************************************/
"use strict";

/* jshint node: true, browser: true, unused: true, undef: true */
/* global android, com, java, javax, exit, UIDevice, CFAbsoluteTimeGetCurrent, NSRunLoop, NSDate */

// global.android is already defined on android devices
// We are defining global.ios on ios devices
if (global.NSObject && global.NSString && typeof global.ios === "undefined") {
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

          // TODO: Check NSProcessInfo.processInfo().environment.objectForKey('BUILD_CONFIGURATION');

          return global.process.isEmulator();
        };
    }
}
if (!global.process.isEmulator) {
    if (global.android) {
        global.process.isEmulator = function() {
            var res = android.os.Build.FINGERPRINT;
            if (res.indexOf("vbox86") >= 0 || res.indexOf("generic") >= 0) { return true; }
            return false;
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

if (typeof global.console.keys === 'undefined') {
    console.keys = function(data) {
        if (typeof data === "string") {
            console.log(data); return;
        }
        console.log("=========[ Keys ]==========");
        for(var key in data) {
            if (data.hasOwnProperty(key)) console.log(key);
        }
        console.log("===========================");
    };
}
