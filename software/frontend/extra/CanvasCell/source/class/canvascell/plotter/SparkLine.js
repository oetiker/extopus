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
 * Draw a spark line
 *
 * The plotter expects to  find an array object in the respective table column.
 *
 */

qx.Class.define("canvascell.plotter.SparkLine", {
    extend : qx.core.Object,

    /**
     * Instanciate the plotter
     *
     * @param cfg {Map} configuration map
     * 
     * <pre class='javascript'>
     * cfg = {
     *    singleScale:  true,
     *    width:        1,
     *    lineColor:    '#color',
     *    sparkColor:   '#color'
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
         * Plot Spark Line
         *
         * @param c {var} canvas drawing context
         * @param cellInfo {var} cellInfo from cellrender
         * @param w {var} canvas width   
         * @param h {Map} canvas height
         * @return {boolean} should the other cells be redrawn because the scaling has changed?
         *
         * The data for the SparkLine must be stored in the cellInfo.value field.
         * Note that the tablemodels do not care what you put into a cell. They just hand the data over to the renderer.
         *
         */
        plot : function(c, cellInfo, w, h) {
            var stack = cellInfo.value;
            var redraw = false;

            if (!qx.lang.Type.isArray(stack)) {
                return false;
            }

            if (stack.length < 2) {
                return false;
            }

            var cfg = this.__cfg;
            var min = stack[0];
            var max = stack[0];

            if (cfg.singleScale) {
                min = this.__min;
                max = this.__max;
            }

            for (var x=0; x<stack.length; x++) {
                var d = stack[x];

                if (min == undefined || d < min) {
                    min = d;

                    if (cfg.singleScale) {
                        this.__min = d;
                        redraw = true;
                    }
                }

                if (max == undefined || d > max) {
                    max = d;

                    if (cfg.singleScale) {
                        this.__max = d;
                        redraw = true;
                    }
                }

                if (isNaN(d)) {
                    return false;
                }
            }

            var range = max - min;

            if (range == 0) {
                return false;
            }

            c.beginPath();
            c.strokeWidth = cfg.width;
            c.strokeStyle = cfg.lineColor;
            var step = w / stack.length;
            c.moveTo(0, Math.round(h - (stack[0] - min) / range * (h - 8) - 4) + 0.5);

            for (var x=1; x<stack.length; x++) {
                c.lineTo(Math.round(x * step) + 0.5, Math.round(h - (stack[x] - min) / range * (h - 8) - 4) + 0.5);
            }

            c.stroke();
            c.beginPath();
            c.fillStyle = cfg.sparkColor;
            c.arc(Math.round((x - 1) * step) + 0.5, Math.round(h - (stack[x - 1] - min) / range * (h - 8) - 4) + 0.5, cfg.sparkRadius, 0, 2 * Math.PI, false);
            c.fill();
            return false;
        },


        /**
         * reset plotter
         */
        reset : function() {
            this.__min = undefined;
            this.__max = undefined;
        }
    }
});
