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
           alias : "button",
           include : "button",

           style : function(states) {
              return {
                icon : "ep/date-bw.png",
                padding : [0, 3, 0, 3],
                marginLeft: 2
              }
/*
                decorator : states.hovered ? "button-hover" : undefined,
//                backgroundColor : undefined,
//                decorator : undefined,
//                width: 19
              }; */
           }
        }
    }
});
