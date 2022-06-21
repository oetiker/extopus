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
    extend: qx.theme.tangible.Appearance,
    appearances: {
        "tree-folder": {
            style(states) {
                return {
                    padding: [0, 8, 2, 10],
                    icon: states.opened
                        ? "@TablerIcons/folder/22"
                        : "@TablerIcons/folder/22",
                    backgroundColor: states.selected
                        ? states.disables
                            ? "primary-disabled"
                            : "primary-selected"
                        : "surface",
                    textColor: states.selected
                        ? "text-on-primary"
                        : "text-disabled-on-primary",
                    iconOpened: "@TablerIcons/folder/22",
                    opacity: states.drag ? 0.5 : undefined
                };
            }
        },

        "menubar-button/icon": {
            style(states) {
                return {
                    textColor: states.disabled
                        ? "text-disabled-on-surface"
                        : (states.pressed || states.hovered)
                            ? "text-on-primary"
                            : "text-on-surface"
                }
            }
        },
        "table/column-button/icon": {
            style(states) {
                return {
                    textColor: "text-on-surface"
                }
            }
        },
        "table/column-button": {
            alias: "button",
      
            style(states) {
              return {
                decorator: "table-header-column-button",
                textColor: "text-primary-on-surface",
                backgroundColor: "surface",
                padding: 3,
                icon: "@TablerIcons/dots-vertical/16"
              };
            }
          },
          "table-column-reset-button": {
            include: "menu-button",
            alias: "menu-button",
            style() {
              return {
                icon: "@TablerIcons/refresh/16"
              };
            }
          },
          "table-column-reset-button/icon": "menubar-button/icon"
    }
});
