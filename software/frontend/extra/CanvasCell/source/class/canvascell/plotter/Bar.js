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
 * This Plugin draws a bar based on the value of the cell.
 */

qx.Class.define("canvascell.plotter.Bar", {
    extend : qx.core.Object,

    /**
     * Instanciate the plotter
     *
     * @param cfg {Map} configuration map
     * 
     * <pre class='javascript'>
     * cfg = {
     *    fill:   '#color',
     *    border: '#color' 
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
        __max : null,


        /**
         * Plot the Bar
         *
         * @param c {var} canvas drawing context
         * @param cellInfo {var} cellInfo from cellrender
         * @param w {var} canvas width
         * @param h {Map} canvas height
         * @return {boolean} should the other cells be redrawn because the scaling has changed?
         */
        plot : function(c, cellInfo, w, h) {
            var d = cellInfo.value;
            var redraw = false;

            if (isNaN(d)){
                return false;
            }

            var cfg = this.__cfg;

            if (d > this.__max) {
                this.__max = d;
                redraw = true;
            }
            if (this.__max == 0){
                return false;
            }
            var bar = Math.round(d * (w - 4) / this.__max);
            c.strokeWidth = 0.5;
            c.fillStyle = cfg.fill;
            c.strokeStyle = cfg.border;
            c.fillRect(0.5, 2.5, bar, h - 6);
            c.strokeRect(0.5, 2.5, bar, h - 6);
            return redraw;
        },


        /**
         * reset any context data stored inside the plotter
         */
        reset : function() {
            this.__max = 0;
        }
    }
});
