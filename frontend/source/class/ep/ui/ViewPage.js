/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/*
 * @asset(ep/view-menu-black.png)
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
        this.set({
            layout: new qx.ui.layout.Grow(),
            visualizer: visualizer
        });
        this.add(visualizer);
        visualizer.addListener('changeTitle',function(e){
            this.setLabel(e.getData());
        },this)

        var button = this.getChildControl('button');

        var menuButton = this._menuButton = new qx.ui.basic.Atom().set({
            icon   : 'ep/view-menu-black.png',
            show   : 'icon',
            cursor : 'pointer',
            visibility: 'excluded'
        });

        button._add(menuButton, {
            row    : 0,
            column : 6
        });

        menuButton.addListener('tap',function(){
            ep.ui.ViewMenu.getInstance().showMenu(menuButton, this);
        },this);

        button.addListener('syncAppearance', this._updateButton, this);
        this._viewProps = {};
        button.addListener('tap',function(){
        },this);
    },

    events : {
        /* the ViewMenu breakout button actually fires this event for us */        
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
        _menuButton: null,
        _view: null,

        /**
         * Unhook the contained visualizer from external influence (eg changeing selection of items in the view table)
         * Override in childs
         */
        unhook : function(){
            this.getVisualizer().unhook();
        },

        /**
         * Only show the breakOut button when the tab is selected.
         *
         * @return {void} 
         */
        _updateButton : function() {
            var button = this.getChildControl('button');

            if (button.hasState('checked')) {
//              ep.data.RemoteControl.getInstance().setState(this.getVisualizer().buildLink());
                this._menuButton.show();
            } else {
                this._menuButton.exclude();
            }
        }
    }
});
