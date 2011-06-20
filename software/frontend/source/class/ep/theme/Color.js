/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    Proprietary
   Authors:    Tobias Oetiker

   $Id: Color.js 333 2010-10-05 20:07:53Z oetiker $

************************************************************************ */

window.lightBlue = "#6eb7e4";
window.darkBlue = "#0066a8";

qx.Theme.define("ep.theme.Color", {
    extend : qx.theme.simple.Color,

    colors : {
        "table-row-background-even"     : "#f3f3f3",
        "table-row-background-odd"      : "#fff",
        "dark-blue"                     : window.darkBlue,
        "table-row-background-selected" : window.lightBlue,
        "background-selected"           : window.lightBlue,
        "border-main"                   : window.lightBlue,
        "tabview-unselected"            : window.darkBlue
    }
});