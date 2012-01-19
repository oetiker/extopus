/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/*
#asset(ep/view-fullscreen.png)
#asset(ep/view-link.png)
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
     * @param args {Map} argument map for the view
     * @param table {String} the view table
     */
    construct : function(title,args,view) {
        this.base(arguments, this['tr'](title));
        this._view = view;

        var button = this.getChildControl('button');
            

        var linkButton = this._linkButton = new qx.ui.basic.Atom().set({
            icon   : 'ep/view-link.png',
            show   : 'icon',
            cursor : 'pointer',
            visibility: 'excluded'
        });

        linkButton.addListener("click", this._buildLink, this);

        button._add(linkButton, {
            row    : 0,
            column : 5
        });

        var breakOutButton = this._breakOutButton = new qx.ui.basic.Atom().set({
            icon   : 'ep/view-fullscreen.png',
            show   : 'icon',
            cursor : 'pointer',
            visibility: 'excluded'
        });
        breakOutButton.addListener("click", this._onBreakOutButtonClick, this);

        button._add(breakOutButton, {
            row    : 0,
            column : 6
        });
        button.addListener('syncAppearance', this._updateButton, this);
    },

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
        },
        recId: {
            nullable: true,
            init    : null,
        },
        key: {
            nullable: false,
            init    : 'abstract'
        }
    },

    members : {
        _breakOutButton : null,
        _linkButton: null,
        _view: null,
        _vizKey: null,
        /**
         * Unhook this visualizer from external influence (eg changeing selection of items in the view table)
         * Override in childs
         */
        onUnhook : function(){},

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
        _updateButton : function() {
            var button = this.getChildControl('button');

            if (button.hasState('checked')) {
                this._breakOutButton.show();
                this._linkButton.show();
            } else {
                this._breakOutButton.exclude();
                this._linkButton.exclude();
            }
        },
        /**
         * Create a linkable argument for this image
         *
         * @return {void} 
         */
        _buildLink: function(){
            var link = 'app='+this._vizKey+';recIds='+this._view.getRecIds().join(',');
            console.log(link);                
        }
    }
});
