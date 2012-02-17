/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/*
#asset(ep/view-*.png)
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
        },this)

        var button = this.getChildControl('button');            

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

        var dashButton = this._dashButton = new qx.ui.basic.Atom().set({
            icon   : 'ep/view-dash.png',
            show   : 'icon',
            cursor : 'pointer',
            visibility: 'excluded'
        });

        dashButton.addListener('click',function(){
            ep.ui.DashMenu.getInstance().showMenu(dashButton, this.getVisualizer().getVizualizerConfig());
        },this);
        
        button._add(dashButton, {
            row    : 0,
            column : 7
        });


        button.addListener('syncAppearance', this._updateButton, this);
        this._viewProps = {};
        button.addListener('click',function(){
            ep.data.RemoteControl.getInstance().setState(visualizer.buildLink());
        },this);
    },

    events : {
        breakout: 'qx.event.type.Event'
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
        _dashButton: null,
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
                this._dashButton.show();
            } else {
                this._breakOutButton.exclude();
                this._dashButton.exclude();
            }
        }
    }
});
