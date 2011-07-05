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
        'epnavigator'           : 'widget',
        'epnavigator/eptabview' : 'tabview',
        'epnavigator/eptree'    : 'eptree',
        'epnavigator/epsearch'  : 'eptable',
        'eptree'                : 'widget',
        'eptree/tree'           : 'treevirtual',
        'eptable'               : 'widget',
        'eptable/table'         : 'table',
        'eptable/search-box'    : 'textfield',

        "datefield/button" :  {
           alias : "combobox/button",
           include : "combobox/button",

           style : function(states) {
              return {
                icon : "ep/date-bw.png",
                padding : [0, 0, 0, 3],
                backgroundColor : undefined,
                decorator : undefined,
                width: 19
              };
          }
        }
    }
});