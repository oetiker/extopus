/* ************************************************************************
   Copyright: 2009 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * A form renderer returning a result ready for integration into a 
 * toolbar.
 */

qx.Class.define("ep.ui.form.renderer.Top", {
    extend : qx.ui.form.renderer.AbstractRenderer,

    /**
     * @param form {Object} form handle
     */                
    construct : function(form) {
        var layout = new qx.ui.layout.HBox(2);
        this._setLayout(layout);
        this.base(arguments, form);
    },

    members : {
        /**
         * Add items to the form
         *
         * @param items {Array} items
         * @param names {Array} names of items
         * @param title {String} not used
         * @return {void} 
         */
        addItems : function(items, names, title) {
            for (var i=0; i<items.length; i++) {
                var item = items[i];
                if (names[i]){
                    var label = new qx.ui.basic.Label(names[i]).set({
                        alignY       : 'middle',
                        paddingRight : 2,
                        marginLeft   : 7
                    });

                    this._add(label);
                    label.setBuddy(item);
                }            
                if (item instanceof qx.ui.form.RadioGroup) {
                    item = this._createWidgetForRadioGroup(item);
                }
                
                item.set({
                    alignY     : 'middle',
                    allowGrowY : false,
                    marginLeft : 3
                });
                this._add(item);
            }
            this._add(new qx.ui.core.Spacer().set({allowStretchX: true}));
        },


        /**
         * Public Methos for adding a button
         *
         * @param button {Widget} a button widget
         * @return {void} 
         */
        addButton : function(button) {
            this._add(button);
        },


        /**
         * public Method for getting the layout.
         *
         * @return {Layout} the layout
         */
        getLayout : function() {
            return this._getLayout();
        }
    }
});
