/* ************************************************************************
   Copyright: 2009 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * Show a logo in the center of the screen 
 */
qx.Class.define("ep.ui.Logo", {
    extend : qx.ui.basic.Atom,

    construct : function() {
        var url = ep.data.FrontendConfig.getInstance().getConfig().logo_large;
        this.base(arguments, null, url);

        this.set({
            show         : 'icon',
            allowGrowX   : true,
            allowGrowY   : true,
            allowShrinkX : true,
            allowShrinkY : true,
            alignX       : 'center',
            alignY       : 'middle',
            center       : true
        });
    }
});
