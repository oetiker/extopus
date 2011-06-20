/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    GPL V3 or later
   Authors:    Tobias Oetiker
   Utf8Check:  äöü

************************************************************************ */

qx.Class.define('ep.data.FrontendConfig', {
    extend : qx.core.Object,
    type : 'singleton',

    properties : {
        /**
                 * when set to null all records show
                 * when set to 'none' no records get selected
                 */
        config : { nullable : true }
    }
});