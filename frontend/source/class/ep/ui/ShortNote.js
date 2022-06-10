/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * A popup at the top edge of the display, hiding itself soon after appearing.
 * will re-appear when its label is set.
 */
qx.Class.define("ep.ui.ShortNote", {
    extend : qx.ui.container.Composite,
    type: 'singleton',

    /**
     * wrap the loading Box around the given widget
     *
     * @param widget {Widget} widget to wrap
     */
    construct : function() {
        this.base(arguments,new qx.ui.layout.HBox().set({
            alignX: 'center'
        }));
        this.set({
            zIndex: -10
        });
        var note = this.__note = new qx.ui.basic.Atom('',"@MaterialIcons/info/16");
        note.set({
            textColor : "tooltip-text",
            backgroundColor : "tooltip",
            decorator: "main-dark",
            padding : [ 1, 3, 2, 3 ]
        });

        this.add(note);
        this.addListener('tap',function(){
            this.hide();
        },this);
        this.getApplicationRoot().add(this,{top:0,left:0,right:0});
    },

    members: {
        __timer: null,
        __note: null,
        /**
         * popup the info and show its content
         *
         * @param text {String} text to show
         */
        setNote: function(text){
            this.__note.setLabel(String(text));
            if (this.__timer){
                this.__timer.stop();
            }
            this.show();
            this.__timer = qx.event.Timer.once(function(){
                this.hide();
            },this,5000);
        }
    }
});
