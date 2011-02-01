/* ************************************************************************
   Copyright: 2009 OETIKER+PARTNER AG
   License:   GPL
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: üöë
************************************************************************ */

/**
 * Qooxdoo has no apperance overrides.
 */
qx.Theme.define("ep.theme.Appearance", {
    extend      : qx.theme.modern.Appearance,
    appearances : {
        'epnavigator' : 'widget',
        'epnavigator/eptabview' : 'tabview',
        'epnavigator/eptree' : 'eptree',
        'epnavigator/epsearch' : 'eptable',
        'eptree' : 'widget',
        'eptree/tree': 'treevirtual',
        'eptable' : 'widget',
        'eptable/table': 'table',
        'eptable/search-box': 'textfield'
    }
});
