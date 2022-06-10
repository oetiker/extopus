/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    Proprietary
   Authors:    Tobias Oetiker

   $Id: Color.js 333 2010-10-05 20:07:53Z oetiker $

************************************************************************ */

window.lightBlue = "#6eb7e4";
window.darkBlue = "#0066a8";

/**
 * Have us some custom colors
 */

qx.Theme.define("ep.theme.Color", {
    extend : qx.theme.tangible.ColorEngine,
    colors: {
        // theme colors
        primary: "rgb(218,41,28)",
        secondary: "rgb(61,57,53)",
        surface: "rgb(255,255,255)",
        error: "rgb(218,0,0)"
    }
});
