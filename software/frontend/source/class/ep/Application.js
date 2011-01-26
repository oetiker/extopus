/* ************************************************************************
   Copyright: 2009 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/* ************************************************************************
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
            var HOME = 'http://www.extopus.org/v/#VERSION#';
            this.base(arguments);
            qx.Class.include(qx.ui.treevirtual.TreeVirtual,
                             qx.ui.treevirtual.MNode);
            // Enable logging in debug variant
            if (qx.core.Variant.isSet("qx.debug", "on")) {
                // support native logging capabilities, e.g. Firebug for Firefox
                qx.log.appender.Native;
                // support additional cross-browser console. Press F7 to toggle visibility
                qx.log.appender.Console;
            }
            var hsplit = new qx.ui.splitpane.Pane("horizontal").set({ decorator : null });

            var rpc = ep.data.Server.getInstance();
            hsplit.add(new ep.ui.EpTree(rpc),2);

            rpc.callAsyncSmart(function(ret){
                ep.data.NodeTableModel.getInstance().setColumns(ret); 
                hsplit.add(new ep.ui.EpTable(),5);
            },'getNodePropertyKeys');   

            this.getRoot().add(hsplit, {
                left   : 0,
                top    : 0,
                right  : 0,
                bottom : 0
            });
        }
    }
});
