/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is srccolor extensions for Firefox.
 *
 * The Initial Developer of the Original Code is arno <arno@renevier.net>.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

const Types = {
    /* bash */
    'application/x-sh': 'bash',
    'text/x-sh': 'bash',

    /* cpp */
    'text/x-csrc': 'cpp',
    'text/x-c++src': 'cpp',
    'text/x-c++hdr': 'cpp',
    'text/x-chdr': 'cpp',

    /* css */
    'text/css': 'css',

    /* diff */
    'text/x-diff': 'diff',

    /* erlang */
    'text/x-erlang': 'erlang',

    /* haskell */
    'text/x-haskell': 'haskell',
    'text/x-literate-haskell': 'haskell',

    /* java */
    'text/x-java': 'java',

    /* javascript */
    'application/javascript': 'javascript',
    'application/x-javascript': 'javascript',
    'text/ecmascript': 'javascript',
    'application/ecmascript': 'javascript',
    'text/javascript': 'javascript',

    /* lisp */
    'text/x-lisp': 'lisp',
    'application/x-lisp': 'lisp',

    /* lua */
    'text/x-lua': 'lua',
    'application/x-lua': 'lua',

    /* perl */
    'text/x-perl': 'perl',
    'application/x-perl': 'perl',

    /* python */
    'text/x-python': 'python',
    'application/x-python': 'python',

    /* ruby */
    'text/x-ruby': 'ruby',
    'application/x-ruby': 'ruby',

    /* scala */
    'text/x-scala': 'scala',

    /* sql */
    'text/x-sql': 'sql',
    'application/x-sql': 'sql',

    /* tex */
    'text/x-tex': 'tex',

    /* vala */
    'text/x-vala': 'vala',

    /* vbscript */
    'application/x-vbscript': 'vbscript',
    'text/x-vbscript': 'vbscript',
};

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/AddonManager.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/NetUtil.jsm");

const Cc = Components.classes;
const Ci = Components.interfaces;

const classID = Components.ID("{a7b7ec07-0803-49cd-819c-cf8b942bdf60}");
const contractID = "@renevier.net/srccolor/sniffer;1";

function log(aString) {
    Components.utils.reportError(aString);
    dump(aString + "\n");
}

var sniffer = {
    webNavInfo: Cc["@mozilla.org/webnavigation-info;1"].getService(Ci.nsIWebNavigationInfo),
    faked: [],

    classDescription: "srccolor",
    classID: classID,
    contractID: contractID,
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIContentSniffer]),

    getMIMETypeFromContent: function(request, data, length) {
        var channel = request.QueryInterface(Ci.nsIChannel);
        if (!channel) {
            throw Components.results.NS_ERROR_FAILURE;
        }
        var contentType = channel.contentType;
        if (Types[contentType] && !this.webNavInfo.isTypeSupported(contentType, null)) {
            this.faked.push({'channel': channel.QueryInterface(Ci.nsIChannel), 'type': contentType});
            return 'text/plain';
        }
        return null;
    }
};

/* code executed in each loaded content document */
var styleRules = ""; //TODO: remove this global variable; see below
var domLoaded = (function() {
    var rootNode = function (aDoc) {
        var root = aDoc.documentElement.body ? aDoc.documentElement.body: aDoc.documentElement;
        var pres = root.getElementsByTagName("pre");
        if (pres.length === 1) {
            root = pres[0];
        } else if (pres.length !== 0) {
            log("invalid document at " + aDoc.location.toString() + "\n");
            return null;
        }

        if (!(root instanceof Ci.nsIDOMHTMLPreElement)) {
            var pre = aDoc.createElement("pre");
            pre.innerHTML = root.innerHTML;
            while (root.firstChild) {
                root.removeChild(root.firstChild);
            }
            root.appendChild(pre);
        }

        return root;
    };

    // custom textContent function: does not include elements whose display
    // property is none (for example, <script> or <style> elements)
    var textContent = function (element) {
        var childs = element.childNodes;
        var res = "";
        var win = element.ownerDocument.defaultView;
        for (let i = 0, len = childs.length; i < len; i++) {
            let child = childs.item(i);
            if (child.nodeType === Ci.nsIDOMNode.TEXT_NODE) {
                res += child.data;
            } else if (child.nodeType === Ci.nsIDOMNode.ELEMENT_NODE) {
                if (win.getComputedStyle(child,null).getPropertyValue('display') !== "none") {
                    res += textContent(child);
                }
            }
        }
        return res;
    };

    function highlightNode(aNode, aLang) {
        var content = textContent(aNode), result = "";
        try {
            result = hljs.highlight(aLang, content).value;
        } catch(e) {
            result = content;
        }
        aNode.innerHTML = "<code>" + result + "</code>";

        if (styleRules) {
            var style = aNode.ownerDocument.createElement("style");
            style.type = 'text/css';
            style.scoped = true;
            style.textContent = styleRules;
            aNode.insertBefore(style, aNode.firstChild);
        }
    }

    return function(evt) {
        var win = evt.currentTarget;
        var wintype = win.document.documentElement.getAttribute("windowtype");
        if (wintype !== "navigator:browser" && wintype !== "navigator:view-source") {
            return;
        }
        var doc = evt.target;

        if (!(doc instanceof Ci.nsIDOMHTMLDocument)) {
            return;
        }
        if (!hljs) { // script has failed to load or has not loaded yet.
            log("highlight.js script is not loaded");
            return;
        }

        var browser = win.getBrowser();
        if (browser.tagName === "tabbrowser") {
            browser = browser.getBrowserForDocument(doc);
        }
        var channel = browser.docShell.currentDocumentChannel;
        var contentType = channel.contentType;
        if (contentType === 'text/plain') {
            for (let i = 0, len = sniffer.faked.length; i < len; i++) {
                let item = sniffer.faked[i];
                if (item.channel == channel) {
                    contentType = item.type;
                    sniffer.faked.splice(i, 1);
                    break;
                }
            }
        }

        if (Types.hasOwnProperty(contentType)) {
            var lang = Types[contentType];
            if (!hljs.LANGUAGES[lang]) {
                log("language " + lang + " not found in hljs\n");
                return;
            }

            var root = doc.documentElement.body ? doc.documentElement.body: doc.documentElement;
            var pres = root.getElementsByTagName("pre");
            for (let i = 0, len = pres.length; i < len; i++) {
                highlightNode(pres[i], lang);
            }
        }
    };
}());

/* setup stuff */

var windowListener = {
    onOpenWindow: function(aWindow) {
        var domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal);
        var windowType = domWindow.document.documentElement.getAttribute("windowtype");
        var loadListener = function() {
            domWindow.removeEventListener("load", loadListener, false);
            loadIntoWindow(domWindow);
        };
        domWindow.addEventListener("load", loadListener, false);
    },
    onCloseWindow: function(aWindow) {},
    onWindowTitleChange: function(aWindow, aTitle) {}
};

function loadIntoWindow (aWindow) {
    if (!aWindow) {
        return;
    }
    aWindow.addEventListener("DOMContentLoaded", domLoaded, false);
}

function unloadFromWindow (aWindow) {
    if (!aWindow) {
        return;
    }
    aWindow.removeEventListener("DOMContentLoaded", domLoaded, false);
}

/* sniffer registration stuff */
var factory = {
    createInstance: function(delegate, iid) {
        return sniffer.QueryInterface(iid);
    },
    lockFactory: function(lock) {}
};

function startup(data, reason) {
    /* register net-content-sniffers component */
    Components.manager.QueryInterface(Ci.nsIComponentRegistrar).registerFactory(classID, "srccolor", contractID, factory);
    Cc['@mozilla.org/categorymanager;1'].getService(Ci.nsICategoryManager).addCategoryEntry("net-content-sniffers", "srccolor", contractID, false, true);

    var enumerator = Services.wm.getEnumerator("navigator:browser");
    while (enumerator.hasMoreElements()) {
        let win = enumerator.getNext().QueryInterface(Ci.nsIDOMWindow);
        loadIntoWindow(win);
    }
    Services.wm.addListener(windowListener);

    enumerator = Services.wm.getEnumerator("navigator:view-source");
    while (enumerator.hasMoreElements()) {
        let win = enumerator.getNext().QueryInterface(Ci.nsIDOMWindow);
        loadIntoWindow(win);
    }

    /* XXX: it seems unlikely that script and css rules string are not loaded
     * when a webpage is loaded. But that's not totally impossible. TODO: make
     * srccolor work in that case */
    AddonManager.getAddonByID(data.id, function(addon, data) {
        function readCssRules(resource) {
            if (!resource) {
                return;
            }
            NetUtil.asyncFetch(resource, function(inputStream, status) {
                if (!Components.isSuccessCode(status)) {
                    return;
                }
                var available = 0;
                try { // throws an error in case of 0-length stream
                    available = inputStream.available();
                } catch(e) {
                    return;
                } 
                styleRules += NetUtil.readInputStreamToString(inputStream, available);
            });
        }

        function userCssFile() {
            var file = Services.dirsvc.get("UChrm", Ci.nsIFile);
            if (!file.exists()) {
                return null;
            }
            file.append("srccolor.css");
            if (!file.exists()) {
                return null;
            }
            return file;
        }

        /* load highlight.js script */
        var script = addon.getResourceURI("modules/highlight.jsm");
        Services.scriptloader.loadSubScript(script.spec, this);

        /* read style rules */
        readCssRules(addon.getResourceURI("content/srccolor.css"));
        readCssRules(userCssFile());
    });

}

function shutdown(data, reason) {
    Services.wm.removeListener(windowListener);
    var enumerator = Services.wm.getEnumerator("navigator:view-source");
    while (enumerator.hasMoreElements()) {
        let win = enumerator.getNext().QueryInterface(Ci.nsIDOMWindow);
        unloadFromWindow(win);
    }

    enumerator = Services.wm.getEnumerator("navigator:browser");
    while (enumerator.hasMoreElements()) {
        let win = enumerator.getNext().QueryInterface(Ci.nsIDOMWindow);
        unloadFromWindow(win);
    }

    Cc['@mozilla.org/categorymanager;1'].getService(Ci.nsICategoryManager).deleteCategoryEntry("app-startup", contractID, false);
    Components.manager.QueryInterface(Ci.nsIComponentRegistrar).unregisterFactory(classID, factory);
}

function install() {
}

function uninstall() {
}
