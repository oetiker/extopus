/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü

   Based on qx.ui.layout.Basic

************************************************************************ */

/**
 * The TardisLayout is a basic layout, which supports positioning of child
 * widgets by absolute left/top coordinates. It does not care about the space
 * requirements of the widgets contained.
 *
 * *Features*
 *
 * * Basic positioning using <code>left</code> and <code>top</code> properties
 * * Margins for top and left side (including negative ones)
 *
 * *Item Properties*
 *
 * <ul>
 * <li><strong>left</strong> <em>(Integer)</em>: The left coordinate in pixel</li>
 * <li><strong>top</strong> <em>(Integer)</em>: The top coordinate in pixel</li>
 * </ul>
 *
 * *Details*
 *
 * The default location of any widget is zero for both
 * <code>left</code> and <code>top</code>.
 *
 * *Example*
 *
 * Here is a little example of how to use the basic layout.
 *
 * <pre class="javascript">
 * var container = new qx.ui.container.Composite(new qx.ui.layout.Basic());
 *
 * // simple positioning
 * container.add(new qx.ui.core.Widget(), {left: 10, top: 10});
 * container.add(new qx.ui.core.Widget(), {left: 100, top: 50});
 * </pre>
 *
 */
qx.Class.define("ep.ui.layout.TardisLayout",
{
  extend : qx.ui.layout.Basic,



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {

    /**
     * and this is where tardis comes in, it is larger on the inside than 
     * the outside.
     */
    _computeSizeHint : function()
    {
      return {
        width : 0,
        height : 0
      };
    }
  }
});
