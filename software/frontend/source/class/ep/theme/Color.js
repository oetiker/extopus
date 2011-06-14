/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    Proprietary
   Authors:    Tobias Oetiker

   $Id: Color.js 333 2010-10-05 20:07:53Z oetiker $

************************************************************************ */

var lightBlue = "#6eb7e4";
var darkBlue = "#0066a8";
qx.Theme.define("ep.theme.Color", {
    extend : qx.theme.simple.Color,

    colors : {
        "table-row-background-even" : "#f3f3f3",
        "table-row-background-odd"  : "#fff",
        "dark-blue" : darkBlue,
        "table-row-background-selected" : lightBlue,
        "background-selected" : lightBlue,
        "border-main" : lightBlue,
        "tabview-unselected" : darkBlue        
    }
});
