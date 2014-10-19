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
 * Draw two bars where the second sits on the first
 * and extends in both directions ... Ideal for average and standarddeviation.
 * The plotter expects a object in the respective table column with the properties
 * mainbar and stackbar.
 */
qx.Class.define("canvascell.plotter.TwoBar", {
    extend : qx.core.Object,

    /**
     * Instanciate the plotter
     *
     * @param cfg {Map} configuration map
     * 
     * <pre class='javascript'>
     * cfg = {
     *    mainbarFill:   '#color',
     *    mainbarBorder: '#color',
     *    stackbarFill:  '#color',
     *    stackbarBorder:'#color'
     * }; 
     * </pre>
     */
    construct : function(cfg) {
        this.base(arguments);

        this.__cfg = {
            mainbarFill    : cfg.mainbarFill || '#f88',
            mainbarBorder  : cfg.mainbarBorder || '#b44',
            stackbarFill   : cfg.stackbarFill || '#88f',
            stackbarBorder : cfg.stackbarBorder || '#44b'
        };

        this.reset();
    },

    members : {
        __cfg : null,
        __max : null,


        /**
         * Do the actual plotting.
         *
         * @param c {var} context
         * @param cellInfo {var} cellinfo
         * @param w {var} width
         * @param h {Map} height
         * @return {boolean} should the row be re-drawn?
         */
        plot : function(c, cellInfo, w, h) {
            var d = cellInfo.value;

            if (isNaN(d.mainbar)) {
                return false;
            }

            var cfg = this.__cfg;
            var sum = d.mainbar;

            if (!isNaN(d.stackbar)) {
                sum += d.stackbar;
            }

            var redraw;

            if (sum > this.__max) {
                this.__max = sum;
                redraw = true;
            }

            var mainbar = Math.round(d.mainbar * (w - 4) / this.__max);
            c.strokeWidth = 0.5;
            c.fillStyle = cfg.mainbarFill;
            c.strokeStyle = cfg.mainbarBorder;
            c.fillRect(0.5, 2.5, mainbar, h - 6);
            c.strokeRect(0.5, 2.5, mainbar, h - 6);

            if (!isNaN(d.stackbar)) {
                var stackbar = Math.round(d.stackbar * w / this.__max);
                c.fillStyle = cfg.stackbarFill;
                c.strokeStyle = cfg.stackbarBorder;
                c.fillRect(mainbar - stackbar + 0.5, 6.5, 2 * stackbar, h - 13);
                c.strokeRect(mainbar - stackbar + 0.5, 6.5, 2 * stackbar, h - 13);
            }

            return redraw;
        },


        /**
         * clear the scaling information.
         *
         * @return {void} 
         */
        reset : function() {
            this.__max = 0;
        }
    }
});
