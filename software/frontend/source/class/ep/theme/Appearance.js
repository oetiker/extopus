/* ************************************************************************
   Copyright: 2009 OETIKER+PARTNER AG
   License:   GPL
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: üöë
************************************************************************ */

/**
 * @asset(ep/date-bw.png)
 * @asset(qx/icon/Tango/22/places/folder-open.png)
 * @asset(qx/icon/Tango/22/places/folder.png)
 */

/**
 * Qooxdoo has no apperance overrides.
 */
qx.Theme.define("ep.theme.Appearance", {
    extend : qx.theme.indigo.Appearance,
    appearances : {
        "tree-folder" :{
            style : function(states){
                var backgroundColor;
                if (states.selected) {
                    backgroundColor = "background-selected";
                    if (states.disabled) {
                        backgroundColor += "-disabled";
                    }
                }
                return {
                    padding : [2, 8, 2, 5],
                    icon : states.opened ? "icon/22/places/folder-open.png" : "icon/22/places/folder.png",
                    backgroundColor : backgroundColor,
                    iconOpened : "icon/22/places/folder-open.png",
                    opacity : states.drag ? 0.5 : undefined
                };
            }
        }
    }
});
