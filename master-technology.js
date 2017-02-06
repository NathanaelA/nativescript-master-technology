/**********************************************************************************
 * (c) 2015-2017, Master Technology
 * Licensed under the MIT license or contact me for a Support or Commercial License
 *
 * I do contract work in most languages, so let me solve your problems!
 *
 * Any questions please feel free to email me or put a issue up on the github repo
 * Version 0.0.8                                      Nathan@master-technology.com
 *********************************************************************************/
"use strict";

/* jshint node: true, browser: true, unused: true, undef: true */
/* global NSObject, NSString, global, android, com, java, javax, exit, UIDevice, CACurrentMediaTime, NSRunLoop, NSDate, require */

// global.android is already defined on android devices
// We are defining global.ios on ios devices
if (global.NSObject && global.NSString && typeof global.ios === "undefined") {
	global.ios = true;
	Object.freeze(global.ios);
}

if (!global.setImmediate) {
	global.setImmediate = global.setTimeout;
	global.clearImmediate = global.clearTimeout;
}

/***
 * Creates a performance.now() function
 */
if (!global.performance) {
	global.performance = {};
}
if (!global.performance.now) {
	if (global.android) {
		global.performance.now = function () {
			return java.lang.System.nanoTime() / 1000000;
		};
	} else if (global.ios) {
		global.performance.now = function() {
			return CACurrentMediaTime();
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
		const application = require('application');
		const dialogs= require('ui/dialogs');
		if (global.android) {
			//noinspection JSUnresolvedFunction,JSUnresolvedVariable
			const mStartActivity = new android.content.Intent(application.android.context, application.android.startActivity.getClass());
			const mPendingIntentId = parseInt(Math.random() * 100000, 10);
			//noinspection JSUnresolvedFunction,JSUnresolvedVariable
			const mPendingIntent = android.app.PendingIntent.getActivity(application.android.context, mPendingIntentId, mStartActivity, android.app.PendingIntent.FLAG_CANCEL_CURRENT);
			//noinspection JSUnresolvedFunction,JSUnresolvedVariable
			const mgr = application.android.context.getSystemService(android.content.Context.ALARM_SERVICE);
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
				exit(0);
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
			exit(0);
		}

	};
}
if (!global.process.isDebug) {
	if (global.android) {

		const getAppSignatures = function() {
			const context = getContext();
			try {
				const packageManager = context.getPackageManager();

				// GET_SIGNATURES = 64
				return packageManager.getPackageInfo(context.getPackageName(), 64).signatures;
			} catch (err) {
				return [];
			}
		};

		global.process.isDebug = function () {
			const DEBUG_PRINCIPAL = new javax.security.auth.x500.X500Principal("CN=Android Debug,O=Android,C=US");
			try {
				const signatures = getAppSignatures();
				const cf = java.security.cert.CertificateFactory.getInstance("X.509");
				for (let i = 0; i < signatures.length; i++) {
					// Convert back into a Certificate
					const stream = new java.io.ByteArrayInputStream(signatures[i].toByteArray());
					const cert = cf.generateCertificate(stream);

					// Get the Principal for the signing Signature
					const SigningPrincipal = cert.getSubjectX500Principal();
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

			// This is not defined in Debug mode as of TNS 1.8, need to check --release (No console available)
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
			return iosProperty(UIDevice, UIDevice.currentDevice).name.toLowerCase().indexOf("simulator") !== -1;
		};
	}
}
if (!global.process.version) {
	if (global.android) {
		global.process.version = function() {
			const context = getContext();
			try {
				const packageManager = context.getPackageManager();

				// GET_PACKAGE = 0
				const pkg = packageManager.getPackageInfo(context.getPackageName(), 0);
				return {version : pkg.versionName, build: pkg.versionCode};
			}
			catch (err) {
				return {version: "", build: 0};
			}
		};
	} else {
		global.process.version = function () {
			const mainBundle = iosProperty(NSBundle, NSBundle.mainBundle);
			const appVersion = mainBundle.objectForInfoDictionaryKey("CFBundleShortVersionString");
			const buildNumber = mainBundle.objectForInfoDictionaryKey("CFBundleVersion");
			return {version: appVersion, build: buildNumber};
		};
	}
}

function iosProperty(theClass, theProperty) {
	if (typeof theProperty === "function") {
		// xCode 7 and below
		return theProperty.call(theClass);
	} else {
		// xCode 8+
		return theProperty;
	}
}

// ---------------------------------------------------------------
// Getting android context
// ---------------------------------------------------------------
function getContext() {
	const ctx = java.lang.Class.forName("android.app.AppGlobals").getMethod("getInitialApplication", null).invoke(null, null);
	if (ctx) { return ctx; }

	return java.lang.Class.forName("android.app.ActivityThread").getMethod("currentApplication", null).invoke(null, null);
}



// Thanks to the NativeScript guys (Yavor Georgiev & Georgi Atanasov) for the basis of the processMessages code
if (!global.process.processMessages) {
	if (global.android) {
		const platform = require('platform');
		let nextMethod, targetField, prepared=false;
		const sdkVersion = parseInt(platform.device.sdkVersion);

		const prepareMethods = function() {
			const clsMsgQueue = java.lang.Class.forName("android.os.MessageQueue");
			const clsMsg = java.lang.Class.forName("android.os.Message");

			const methods = clsMsgQueue.getDeclaredMethods();
			let i;
			for (i = 0; i < methods.length; i++) {
				if (methods[i].getName() === "next") {
					nextMethod = methods[i];
					nextMethod.setAccessible(true);
					break;
				}
			}

			let fields = clsMsg.getDeclaredFields();
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
			let quit = false, counter = 0;
			if (!prepared) { prepareMethods(); }

			let queue = android.os.Looper.myQueue(), msg;
			setTimeout(function() { quit = true;}, 250);

			while (!quit ) {

				counter++;
				msg = nextMethod.invoke(queue, null);
				if (msg) {
					const target = targetField.get(msg);
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
	console.keys = function(data, printValue) {
		if (typeof data === "string") {
			console.log(data); return;
		}
		console.log("=========[ Keys ]==========");
		for(var key in data) {
			if (data.hasOwnProperty(key)) {
				if (printValue) {
					console.log(key + ':  ', data[key]);
				} else {
					console.log(key);
				}
			}
		}
		console.log("===========================");
	};
}
