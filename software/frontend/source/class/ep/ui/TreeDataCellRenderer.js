/* ************************************************************************                      
   Copyright: 2009 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü

   Overriding spaceing from source/class/qx/ui/treevirtual/SimpleTreeDataCellRenderer.js
   
************************************************************************ */

/**
 * A data cell renderer for the tree column of a simple tree using modified
 * placement for the icon and indicator elements.
 */
qx.Class.define("ep.ui.TreeDataCellRenderer",
{
  extend : qx.ui.treevirtual.SimpleTreeDataCellRenderer,

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {

    /**
     * Add the indentation for this node of the tree.
     *
     * The indentation optionally includes tree lines.  Whether tree lines are
     * used depends on (a) the properties 'useTreeLines' and
     * 'excludeFirstLevelTreelines' within this class; and (b) the widget
     * theme in use (some themes don't support tree lines).
     *
     * @param cellInfo {Map} The information about the cell.
     *   See {@link qx.ui.table.cellrenderer.Abstract#createDataCellHtml}.
     *
     * @param pos {Integer}
     *   The position from the left edge of the column at which to render this
     *   item.
     *
     * @return {Map}
     *   The returned map contains an 'html' member which contains the html for
     *   the indentation, and a 'pos' member which is the starting position
     *   plus the width of the indentation.
     */
    _addIndentation : function(cellInfo, pos)
    {
      var node = cellInfo.value;
      var imageData;
      var html = "";

      // Generate the indentation.  Obtain icon determination values once
      // rather than each time through the loop.
      var bUseTreeLines = this.getUseTreeLines();
      var bExcludeFirstLevelTreeLines = this.getExcludeFirstLevelTreeLines();
      var bAlwaysShowOpenCloseSymbol = this.getAlwaysShowOpenCloseSymbol();

      for (var i=0; i<node.level; i++)
      {
        imageData = this._getIndentSymbol(i, node, bUseTreeLines,
                                          bAlwaysShowOpenCloseSymbol,
                                          bExcludeFirstLevelTreeLines);

        var rowHeight = cellInfo.table.getRowHeight();

        html += this._addImage(
        {
          url         : imageData.icon,
          position    :
          {
            top         : 4 + (imageData.paddingTop || 0),
            left        : pos + (imageData.paddingLeft || 0),
            width       : rowHeight + 3,
            height      : rowHeight
          },
          imageWidth  : rowHeight,
          imageHeight : rowHeight
        });
        pos += rowHeight + 3;
      }

      return (
        {
          html : html,
          pos  : pos
        });
    },

    /**
     * Add the icon for this node of the tree.
     *
     * @param cellInfo {Map} The information about the cell.
     *   See {@link qx.ui.table.cellrenderer.Abstract#createDataCellHtml}.
     *
     * @param pos {Integer}
     *   The position from the left edge of the column at which to render this
     *   item.
     *
     * @return {Map}
     *   The returned map contains an 'html' member which contains the html for
     *   the icon, and a 'pos' member which is the starting position plus the
     *   width of the icon.
     */
    _addIcon : function(cellInfo, pos)
    {
      var node = cellInfo.value;
      var tm = qx.theme.manager.Appearance.getInstance();
      // Add the node's icon
      var imageUrl = (node.bSelected ? node.iconSelected : node.icon);

      if (!imageUrl)
      {
        if (node.type == qx.ui.treevirtual.SimpleTreeDataModel.Type.LEAF)
        {
          var o = tm.styleFrom("treevirtual-file");
        }
        else
        {
          var states = { opened : node.bOpened };
          var o = tm.styleFrom("treevirtual-folder", states);
        }

        imageUrl = o.icon;
      }

      var rowHeight = cellInfo.table.getRowHeight();

      var html = this._addImage(
      {
        url         : imageUrl,
        position    :
        {
          top         : 2,
          left        : pos,
          width       : rowHeight + 3,
          height      : rowHeight
        },
        imageWidth  : rowHeight,
        imageHeight : rowHeight
      });

      return (
        {
          html : html,
          pos  : pos + rowHeight + 3
        });
    }
  }
});
