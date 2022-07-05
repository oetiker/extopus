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
    extend: qx.theme.indigo.Appearance,
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
                        : "text-on-surface",
                    iconOpened: "@TablerIcons/folder/22",
                    opacity: states.drag ? 0.5 : undefined
                };
            }
        },
        "menubar-button": {
            style(states) {
                return {
                    padding: padding,
                    cursor: states.disabled ? undefined : "pointer",
                    textColor: "text-on-surface"
                };
            }
        },
        "tabview-page/button": {
            style(states) {
              var decorator;
      
              // default padding
              if (states.barTop || states.barBottom) {
                var padding = [8, 16, 8, 13];
              } else {
                var padding = [8, 4, 8, 4];
              }
      
              // decorator
              if (states.checked) {
                if (states.barTop) {
                  decorator = "tabview-page-button-top";
                } else if (states.barBottom) {
                  decorator = "tabview-page-button-bottom";
                } else if (states.barRight) {
                  decorator = "tabview-page-button-right";
                } else if (states.barLeft) {
                  decorator = "tabview-page-button-left";
                }
              } else {
                for (var i = 0; i < padding.length; i++) {
                  padding[i] += 1;
                }
                // reduce the size by 1 because we have different decorator border width
                if (states.barTop) {
                  padding[2] -= 1;
                } else if (states.barBottom) {
                  padding[0] -= 1;
                } else if (states.barRight) {
                  padding[3] -= 1;
                } else if (states.barLeft) {
                  padding[1] -= 1;
                }
              }
      
              return {
                zIndex: states.checked ? 10 : 5,
                decorator: decorator,
                textColor: states.disabled
                  ? "text-disabled"
                  : states.checked
                  ? "primary"
                  : "text-on-surface",
                padding: padding,
                cursor: "pointer"
              };
            }
        },
        "menubar-button/icon": {
            style(states) {
                return {
                    textColor: states.disabled
                        ? "#aaa"
                        : (states.pressed || states.hovered)
                            ? "sunrise-red-light"
                            : "sunrise-red"
                }
            }
        },
        "table/column-button/icon": {
            style(states) {
                return {
                    textColor: "#000"
                }
            }
        },
        "table/column-button": {
            alias: "button",
      
            style(states) {
              return {
                decorator: "table-header-column-button",
                textColor: "text-on-surface",
                backgroundColor: "#fff",
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
