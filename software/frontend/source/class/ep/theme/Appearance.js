/* ************************************************************************
   Copyright: 2009 OETIKER+PARTNER AG
   License:   GPL
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: üöë
************************************************************************ */
/* ****
#asset(ep/date-bw.png)
****/
/**
 * Qooxdoo has no apperance overrides.
 */
qx.Theme.define("ep.theme.Appearance", {
    extend : qx.theme.simple.Appearance,

    appearances : {
        "virtual-tree" : "list",
        "datefield/button" :  {
           alias : "button",
           include : "button",
           style : function(states) {
              return {
                icon : "ep/date-bw.png",
                padding : [0, 3, 0, 3],
                marginLeft: 2
              }
           }
        }
    }
});
