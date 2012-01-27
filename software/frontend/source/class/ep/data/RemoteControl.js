/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    GPL V3 or later
   Authors:    Tobias Oetiker
   Utf8Check:  äöü

************************************************************************ */

/**
 * An {@link qx.ui.table.model.Remote} implementation for accessing
 * accessing the node cache on the server.
 */
qx.Class.define('ep.data.RemoteControl', {
    extend : qx.core.Object,
    type : 'singleton',


    /**
     * Create an instance of the remote table model.
     */
    construct : function() {
        this.base(arguments);
        /* give the History object a more relaxed attitude towards encoding stuff */
        qx.Class.patch(qx.bom.History,ep.data.MHistoryRelaxedEncoding);
        var h = this.__history = qx.bom.History.getInstance();
        h.addListener('changeState',this._loadVisualizer,this);
        this.__enabled = true;
        this._loadVisualizer();
    },

    members : {
        __args: null,
        __history: null,
        __enabled: true,
        /**
         * Load a new visualizer and place it in a window
         *
         * @param {Event} history setState event
         * @return {void} 
         */       
        setState: function(value){
            this.__enabled = false;
            this.__history.setState(value);
            this.__enabled = true;
        },
        /**
         * Load a new visualizer and place it in a window
         *
         * @param {Event} history setState event
         * @return {void} 
         */       
        _loadVisualizer : function() {
            var state = this.__history.getState();
            if (! state){
                this.debug('no initial state');
                return;
            }
            if (! this.__enabled){
                this.debug('skipping '+state);
                return;
            }
            var items = state.split(';');
            var args = this.__args = {};
            for (var i=0;i<items.length;i++){
                var item = items[i].split('=');
                var value =  decodeURIComponent(item[1]);
                args[item[0]] = value != 'null' ? value : null;
            }            
            var rpc = ep.data.Server.getInstance();            
            if (args.recIds && args.app){
                args.recIds = args.recIds.split(',');
                rpc.callAsyncSmart(
                    qx.lang.Function.bind(this._showVisualizers, this),
                    'getVisualizers', 
                    args.recIds.length > 1 ? 'multi' : 'single' ,
                    args.recIds[0]
                );
            }
            else {
                this.debug('Ignoring '+state+' could not find recIds and app properties');
            }
            
        },
        /**
         * Wrap the visualizer in a window and pop it open
         *
         * @param {Array} list of potential visualizers
         * @return {void} 
         */       
        _showVisualizers : function(vizList) {
            for (var i=0; i<vizList.length; i++) {
                var viz = vizList[i];
                if (viz.visualizer == this.__args.app){
                    viz.arguments.recIds = this.__args.recIds;
                    var control = ep.visualizer.AbstractVisualizer.createVisualizer(viz.visualizer,viz.title, viz.arguments,null);
                    var win = new qx.ui.window.Window(viz.caption).set({
                        allowMinimize: false,
                        showMinimize: false,
                        height: 400,
                        width: 700
                    });                    

                    control.addListener('changeTitle',function(e){
                        win.setCaption(e.getData());
                    },this)

                    win.setLayout(new qx.ui.layout.Grow());
                    win.add(control);
                    win.addListenerOnce('close', function(e) {
                        win.getApplicationRoot().remove(win);
                        win.dispose();
                    },this);                    
                    win.maximize();
                    win.center();
                    win.show();
                    control.setUserCfg(this.__args);
                    return;
                }
            }            
        }

    }
});
