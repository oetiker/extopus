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
        'epnavigator/eptabview' : 'tabview',
        'epnavigator/eptree' : 'treeview',
        'epnavigator/epsearch' : 'eptable',
        'eptree/tree': 'treeview',
        'eptable/table': 'table',
        'eptable/search-box': 'textfield'
    }
});
