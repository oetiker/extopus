/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    Proprietary
   Authors:    Tobias Oetiker

   $Id: Color.js 333 2010-10-05 20:07:53Z oetiker $

************************************************************************ */

window.lightBlue = "rgb(61,57,53)";
window.darkBlue = "rgb(218,41,28)";

/**
 * Have us some custom colors
 */

qx.Theme.define("ep.theme.Color", {
    extend : qx.theme.indigo.Color,
    colors: {
        // theme colors
        "sunrise-red": 'rgb(218,41,28)',
        "sunrise-grey-dusk": 'rgb(61,57,53)',
        "sunrise-pale-dawn": 'rgb(230,227,223)',
        "sunrise-red-light": "rgba(218,41,28,0.70)",
        "primary": "sunrise-red",
        "link": "sunrise-red",
        "secondary": "sunrise-pale-dawn",
        "surface": "rgb(255,255,255)",
        "primary-diabled": "sunrise-grey-dusk",
        "primary-selected": "sunrise-red",
        "dark-blue": "sunrise-red",
        "tabview-unselected": "sunrise-red",
        "background-selected": "sunrise-red",
        "tabview-button-border": "sunrise-red",
        "highlight": "sunrise-red", 
        "highlight-shade": "sunrise-red",
        "table-row-background-focused-selected": "sunrise-red-light",
        "table-row-background-selected": "sunrise-red",
        "table-focus-indicator": "sunrise-red",
        "text-on-surface": "rgb(0,0,0)",
        "text-on-secondary": "rgb(0,0,0)",
        "text-on-primary": "rgb(255,255,255)",
        "text-disabled-on-primary": "rgb(128,128,128)",

    }
});
