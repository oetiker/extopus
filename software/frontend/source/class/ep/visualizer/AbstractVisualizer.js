/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */
/**********
#asset(qx/icon/${qx.icontheme}/16/actions/edit-redo.png)
***********/
/**
 * Visualization widgets they are re-usable by calling .setArgs(args)
**/
qx.Class.define("ep.visualizer.AbstractVisualizer", {
    extend : qx.ui.tabview.Page,
    type: 'abstract',
    construct : function(title) {                
        this.base(arguments,this['tr'](title));        
        var breakOutButton = this._breakOutButton = new qx.ui.basic.Atom().set({
            icon: 'icon/16/actions/edit-redo.png',
            show: 'icon',
            opacity: 0.7,
            cursor: 'pointer'            
        });
        breakOutButton.exclude();
        var button = this.getChildControl('button');
        button._add(breakOutButton,{row: 0, column: 5});
        breakOutButton.addListener("click", this._onBreakOutButtonClick, this);
        breakOutButton.addListener("mouseover", function(){
            breakOutButton.setOpacity(1);
        });
        breakOutButton.addListener("mouseout", function(){
            breakOutButton.setOpacity(0.7);
        });
        button.addListener('syncAppearance',this._updateBreakOutButton,this);
    },
    statics: {
        KEY: 'name'
    },
    events : {
    /**
     * Fired by {@link qx.ui.tabview.Page} if the breakout button is clicked.
     *
     * Event data: The Page.
     */
        breakout : "qx.event.type.Data"
    },


    properties: {
        args: {
            nullable: true,
            init: null,
            apply: '_applyArgs'
        }
    },
    members: {
        _breakOutButton: null,
        _applyArgs: function(newArgs,oldArgs){
            this.error('overwrite _applyArgs in the child object');
        },
        _onBreakOutButtonClick : function() {
            this.fireDataEvent("breakout", this);
        },
        _updateBreakOutButton : function(){
            var button = this.getChildControl('button');
            if ( button.hasState('checked') ){
                this._breakOutButton.show();
            }
            else {
                this._breakOutButton.exclude();
            }
        }
    }
});
