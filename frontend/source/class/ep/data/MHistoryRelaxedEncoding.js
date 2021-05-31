/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    GPL V3 or later
   Authors:    Tobias Oetiker
   Utf8Check:  äöü

************************************************************************ */

/**
 * Make the History object use encodeURI instead of encodeURIComponent
 * in order to generate nicer urls
 **/
qx.Mixin.define("ep.data.MHistoryRelaxedEncoding",
{
  members :
  {

    /**
     * Encodes the state value into a format suitable as fragment identifier.
     *
     * @param value {String} The string to encode
     * @return {String} The encoded string
     */
    _encode : function (value)
    {
      if (qx.lang.Type.isString(value)) {
        return encodeURI(value);
      }

      return "";
    },


    /**
     * Decodes a fragment identifier into a string
     *
     * @param value {String} The fragment identifier
     * @return {String} The decoded fragment identifier
     */
    _decode : function (value)
    {
      if (qx.lang.Type.isString(value)) {
        return decodeURI(value);
      }

      return "";
    }
  }
});
