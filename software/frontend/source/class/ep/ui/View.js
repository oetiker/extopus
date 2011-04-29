/* ************************************************************************
   Copyright: 2009 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * Show page from monitoring System.
 */
qx.Class.define("ep.ui.View", {
    extend : qx.ui.embed.Iframe,
    construct : function() {
        this.base(arguments,"resource/ep/page.html");
    }
});
