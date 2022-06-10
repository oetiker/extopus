/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    GPL V3 or later
   Authors:    Tobias Oetiker
   Utf8Check:  äöü

************************************************************************ */

/**
 * A status window singelton. There is only one instance, several calls to
 * open will just change the windows content on the fly.
 *
 * <pre code='javascript'>
 * var msg = ep.ui.MsgBox.getInstance();
 * msg.error('Title','Message');
 * </pre>
 */
qx.Class.define("ep.ui.MsgBox", {
    extend : qx.ui.window.Window,
    type : "singleton",

    construct : function() {
        this.base(arguments);

        this.set({
            modal          : true,
            showMinimize   : false,
            showMaximize   : false,
            contentPadding : 15
        });

        this.setLayout(new qx.ui.layout.VBox(20));

        // setting the lable to an empty string, so that the lable widget gets
        // created in the first place and hence the selectable attribute
        // can be set on it
        var body = new qx.ui.basic.Atom('').set({
            rich       : true,
            gap        : 10,
            allowGrowY : true,
            allowGrowX : false,
            selectable : true
        });

        this.add(body);
        this.__body = body;

        var box = new qx.ui.container.Composite;
        box.setLayout(new qx.ui.layout.HBox(5, "right"));
        this.add(box);

        var that = this;

        var btn_cnl = this.__mk_btn(this.tr("Cancel"), "@MaterialIcons/cancel/16");
        this.__btn_cnl = btn_cnl;

        btn_cnl.addListener("execute", function(e) {
            that.close();
        });

        box.add(btn_cnl);

        btn_cnl.addListener('appear', function(e) {
            btn_cnl.focus();
        }, this);

        var btn_app = this.__mk_btn(this.tr("Apply"), "@MaterialIcons/done/16");
        this.__btn_app = btn_app;

        btn_app.addListener("execute", function(e) {
            that.close();
        });

        box.add(btn_app);

        var btn_ok = this.__mk_btn(this.tr("OK"), "@MaterialIcons/done/16");
        this.__btn_ok = btn_ok;

        btn_ok.addListener("execute", function(e) {
            that.close();
        });

        btn_ok.addListener('appear', function(e) {
            btn_ok.focus();
        }, this);

        box.add(btn_ok);

        this.getApplicationRoot().add(this);
    },

    members : {
        __body : null,
        __btn_ok : null,
        __btn_app : null,
        __btn_cnl : null,


        /**
         * Open the message box
         *
         * @param titel {String} window title
         * @param text {String} contents
         * @return {void} 
         */
        __open : function(titel, text) {
            this.setCaption(String(titel));

            this.set({
                width  : 400,
                height : 100
            });

            this.__body.setLabel(String(text));
            this.center();
            this.open();
        },


        /**
         * Create a button which is at least 40 pixel wide
         *
         * @param lab {String} label
         * @param ico {Icon} icon
         * @return {Button} button widget
         */
        __mk_btn : function(lab, ico) {
            var btn = new qx.ui.form.Button(lab, ico).set({ minWidth : 40 });
            return btn;
        },


        /**
         * Open the Error popup
         *
         * @param titel {String} title
         * @param text {String} body
         * @return {void} 
         */
        error : function(titel, text) {
            this.__body.setIcon("@MaterialIcons/error_outline/32");
            this.setIcon("@MaterialIcons/error_outline/16");
            this.__btn_ok.setVisibility('visible');
            this.__btn_app.setVisibility('excluded');
            this.__btn_cnl.setVisibility('excluded');
            this.__btn_ok.focus();
            this.__open(titel, text);
        },


        /**
         * Show server error message
         *
         * @param exc {Map} callAsync exception
         * @return {void} 
         */
        exc : function(exc) {
            this.__body.setIcon("@MaterialIcons/error_outline/32");
            this.setIcon("@MaterialIcons/error_outline/16");
            this.__btn_ok.setVisibility('visible');
            this.__btn_app.setVisibility('excluded');
            this.__btn_cnl.setVisibility('excluded');
            this.__btn_ok.focus();
            var trace = '';

            //            if (exc.code == 2) {
            //               trace = "<br/>Stack Trace: " + qx.dev.StackTrace.getStackTrace().join("<br/>");
            //            }
            this.__open(this.tr('RPC Error %1', exc.code), this.tr('%1 (Error Code %2)%3', exc.message, exc.code, trace));
        },


        /**
         * Open the Info popup
         *
         * @param titel {String} title
         * @param text {String} body
         * @return {void} 
         */
        info : function(titel, text) {
            this.__body.setIcon("@MaterialIcons/info/32");
            this.setIcon("@MaterialIcons/info/16");
            this.__btn_ok.setVisibility('visible');
            this.__btn_app.setVisibility('excluded');
            this.__btn_cnl.setVisibility('excluded');
            this.__btn_ok.focus();
            this.__open(titel, text);
        },


        /**
         * Open the Warning popup with optional callback
         *
         * @param titel {String} window title
         * @param text {String} content
         * @param exec_action {Function} callback to run when the apply button is pressed
         * @return {void} 
         */
        warn : function(titel, text, exec_action) {
            this.__body.setIcon("@MaterialIcons/warning_amber/32");
            this.setIcon("@MaterialIcons/warning_amber/16");
            if (exec_action){
                this.__btn_ok.setVisibility('excluded');
                this.__btn_cnl.setVisibility('visible');
                this.__btn_app.setVisibility('visible');
                var listener = this.__btn_app.addListenerOnce("execute", exec_action);
                this.addListenerOnce('close', function() {
                    this.removeListenerById(listener);
                }, this);
            }
            else {
                this.__btn_app.setVisibility('excluded');
                this.__btn_cnl.setVisibility('excluded');
                this.__btn_ok.setVisibility('visible');
            }
            this.__open(titel, text);
        }
    }
});
