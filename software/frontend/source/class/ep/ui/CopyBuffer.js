/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/*
#asset(qx/icon/${qx.icontheme}/16/status/dialog-information.png)
*/

/**
 * A hidden textarea automatically focussing and selecting its content when it get set.
 */
qx.Class.define("ep.ui.CopyBuffer", {
    extend : qx.ui.form.TextArea,
    type: 'singleton',

    /**
     * setup the textarea
     */
    construct : function() {
        this.base(arguments);
        this.set({
            width: 100,
            height: 100
        });
        this.getApplicationRoot().add(this,{top:-120,left: -120});
    },

    members: {
        /**
         * set the content of the copy buffer
         *
         * @param text {String} text to put into the buffer
         */
        setBuffer: function(text){
            this.setValue(text);
            this.focus();
            this.selectAllText();
            ep.ui.ShortNote.getInstance().setNote(this.tr("Press [ctrl]+[c] to copy selection."));
        }
    }
});
