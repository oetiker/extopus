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
qx.Class.define("ep.ui.ViewPage", {
    extend : qx.ui.tabview.Page,
    /**
     * create a page for the View Tab with the given title
     * 
     * @param vizWidget {Widget} visualization widget to embedd
     */
    construct : function(visualizer) {        
        this.base(arguments, visualizer.getTitle());
        this.setLayout(new qx.ui.layout.Grow());            
        this.add(visualizer);

        this.setVisualizer(visualizer);

        visualizer.addListener('changeTitle',function(e){
            this.setLabel(e.getData());
        })

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
        this._viewProps = {};
    },

    properties : {
        /**
         * the vizualization widget contained here
         */
        visualizer : {
            nullable : true,
            init     : null
        }
    },

    members : {
        _breakOutButton : null,
        _linkButton: null,
        _view: null,
        /**
         * Unhook the contained visualizer from external influence (eg changeing selection of items in the view table)
         * Override in childs
         */
        unhook : function(){
            this.getVisualizer().unhook();
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
            var link = this.getVisualizer().buildLink();
            console.log(link);                
        }
    }
});
