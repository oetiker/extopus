/* ************************************************************************

   Copyright:
     2010 OETIKER+PARTNER AG, http://www.oetiker.ch
     
   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tobias Oetiker (oetiker)

************************************************************************ */
// Utf8Check: äöü

/**
 * Plotter Plugin for the Canvas cellrenderer.
 * Draw little bar chart with some extra options
 *
 * The plotter expects to find an object with the following properties
 * { data: [...],  left: l, right: r }
 *
 * the values of left and right are used to switch as many bars
 * from the right and left to the 'bad' color.
 */

qx.Class.define("canvascell.plotter.QBars", {
    extend : qx.core.Object,

    /**
     * Instanciate the plotter
     *
     * @param cfg {Map} configuration map
     * 
     * <pre class='javascript'>
     * cfg = {
     *    badBarColor:  '#color',
     *    badBgColor:  '#color',
     *    goodBarColor:  '#color',
     *    goodBgColor:  '#color',
     * }; 
     * </pre>
     */
    construct : function(cfg) {
        this.base(arguments);
        this.__cfg = cfg;
        this.reset();
    },

    members : {
        __cfg : null,
        __min : null,
        __max : null,


        /**
         * Plot QBars
         *
         * @param c {var} canvas drawing context
         * @param cellInfo {var} cellInfo from cellrender
         * @param w {var} canvas width   
         * @param h {Map} canvas height
         * @return {boolean} should the other cells be redrawn because the scaling has changed?
         *
         * The data for the QBars must be stored in the cellInfo.value field.
         *
         */
        plot : function(c, cellInfo, w, h) {
            var bar = cellInfo.value;
            var redraw = false;

            if (!qx.lang.Type.isObject(bar)) {
                return false;
            }
            var d = bar.data;

            if (!qx.lang.Type.isArray(d) || d < 1) {
                return false;
            }
            var max = 0;
            for (var i=0;i<d.length;i++){                
                if (max < d[i]){
                    max = d[i];
                }
            }
            var cfg = this.__cfg;
            var step = w / d.length;
            var vPad = 3;            
            for (var i=0;i<d.length;i++){                
                 var bad = bar.left > i || d.length - bar.right <= i;
                 c.fillStyle = bad ? cfg.badBgColor : cfg.goodBgColor;
                 c.fillRect(i*step,vPad,step,h-2*vPad);
                 if (max > 0){
                     c.fillStyle = bad ? cfg.badBarColor : cfg.goodBarColor;
                     var v = d[i]/max * (h-2*vPad);
                     c.fillRect(i*step,h-vPad-v,step,v);
                 }
            }
            return false;
        },

        /**
         * reset plotter
         */
        reset : function() {
        }
    }
});
