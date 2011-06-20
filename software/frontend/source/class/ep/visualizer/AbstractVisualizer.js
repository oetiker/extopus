/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/*
#asset(ep/view-fullscreen.png)
*/

/**
 * Abstract Visualization widget.
 */
qx.Class.define("ep.visualizer.AbstractVisualizer", {
    extend : qx.ui.tabview.Page,
    type : 'abstract',
    /**
     * create a visualization widget with the given title
     * 
     * @param title {String} title to display on the tab
     */
    construct : function(title) {
        this.base(arguments, this['tr'](title));

        var breakOutButton = this._breakOutButton = new qx.ui.basic.Atom().set({
            icon   : 'ep/view-fullscreen.png',
            show   : 'icon',
            cursor : 'pointer'
        });
        breakOutButton.addListener("click", this._onBreakOutButtonClick, this);

        breakOutButton.exclude();
        var button = this.getChildControl('button');

        button._add(breakOutButton, {
            row    : 0,
            column : 5
        });
        button.addListener('syncAppearance', this._updateBreakOutButton, this);
    },

    statics : { KEY : 'name' },

    events : {
        /**
         * Fired by {@link qx.ui.tabview.Page} if the breakout button is clicked.
         *
         * Event data: The Page.
         */
        breakout : "qx.event.type.Data"
    },

    properties : {
        /**
         * arguments defining the visualizers configuration.
         */
        args : {
            nullable : true,
            init     : null,
            apply    : '_applyArgs'
        }
    },

    members : {
        _breakOutButton : null,


        /**
         * Configure the visualizer. This must be overridden in the child code.
         *
         * @param newArgs {Map} old args
         * @param oldArgs {Map} new args
         * @return {void} 
         */
        _applyArgs : function(newArgs, oldArgs) {
            this.error('overwrite _applyArgs in the child object');
        },


        /**
         * Fire a breakout event for clicks on the breakOut button
         *
         * @param e {Event} click event
         * @return {void} 
         */
        _onBreakOutButtonClick : function(e) {
            this.fireDataEvent("breakout", this);
            e.stop();
        },


        /**
         * Only show the breakOut button when the tab is selected.
         *
         * @return {void} 
         */
        _updateBreakOutButton : function() {
            var button = this.getChildControl('button');

            if (button.hasState('checked')) {
                this._breakOutButton.show();
            } else {
                this._breakOutButton.exclude();
            }
        }
    }
});
