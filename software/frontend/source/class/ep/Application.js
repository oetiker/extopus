/* ************************************************************************
   Copyright: 2009 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/* ************************************************************************
#asset(ep/*)
#asset(ep/page/*)
************************************************************************ */

qx.Class.define("ep.Application", {
    extend : qx.application.Standalone,

    members : {
        /**
         * Launch the remocular application.
         *
         * @return {void} 
         */
        main : function() {
            // Call super class
            this.base(arguments);
            qx.Class.include(qx.ui.treevirtual.TreeVirtual,
                             qx.ui.treevirtual.MNode);
            // Enable logging in debug variant
            if (qx.core.Environment.get("qx.debug")) {
                // support native logging capabilities, e.g. Firebug for Firefox
                qx.log.appender.Native;
                // support additional cross-browser console. Press F7 to toggle visibility
                qx.log.appender.Console;
            }
            var root = this.getRoot();
            var desktop = ep.ui.Desktop.getInstance();
            root.add(desktop,{
                left   : 0,
                top    : 0,
                right  : 0,
                bottom : 0
            });       
            var rpc=ep.data.Server.getInstance();
            rpc.callAsyncSmart(function(cfg){
                if (cfg.frontend.title){
                    root.add(new qx.ui.basic.Label(cfg.frontend.title).set({
                        font: 'bold'
                    }),{
                        top    : 8,
                        right  : 8
                    });
                };
                ep.data.FrontendConfig.getInstance().setConfig(cfg.frontend);
                desktop.populate(cfg);                
            },'getConfig');
        }
    }
});
