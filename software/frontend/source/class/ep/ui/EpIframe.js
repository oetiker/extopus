/* ************************************************************************
   Copyright: 2009 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * Show page from monitoring System.
 */
qx.Class.define("ep.ui.EpIframe", {
    extend : qx.ui.embed.ThemedIframe,
    construct : function(url) {
        this.base(arguments,url);
    }
});
