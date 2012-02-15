/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * Abstract Visualization widget.
 */
qx.Class.define("ep.visualizer.AbstractVisualizer", {
    extend : qx.ui.core.Widget,
    type : 'abstract',
    /**
     * create a visualization widget with the given title.
     * 
     * @param instance {String} unique key for visualizer
     * @param title {String} title to display on the tab
     * @param args {Map} argument map for the view
     * @param table {String} the view table    
     *
     * common arguments: recIds: [], compact: true
     */
    construct : function(instance, title,args,view) {
        this.base(arguments);
        this.set({
            allowShrinkX: true,
            allowShrinkY: true,
            allowGrowX: true,
            allowGrowY: true
        });
        this.setTitle(title);
        this.setInstance(instance);
        this._viewProps = {};
        this._userCfg = {};
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
        title: {
            nullable: true,
            init: 'Untitled',
            event: 'changeTitle'
        },
        recIds: {
            init: []
        },
        instance: {
        }
    },
    statics: {
       /**
         * Create new a visualizer widget according to the given configuration. At first glance the configuration
         * map has a <code>title</code>, <code>caption</code> and <code>arguments</code> property.
         *
         * @param vizMap {Map} visualizer configuration map
         * @return {Widget} visualizer widget
         */
        createVisualizer : function(viz,view){
            var visualizer = viz.visualizer;
            var instance = viz.instance;
            var title = viz.title;
            var args = viz.arguments;
            var control;
            switch(visualizer)
            {
                case ep.visualizer.Chart.KEY:  
                    control = new ep.visualizer.Chart(instance, title, args,view);
                    break;

                case ep.visualizer.MultiData.KEY:
                    control = new ep.visualizer.MultiData(instance, title, args,view);
                    break;

                case ep.visualizer.IFrame.KEY:
                    control = new ep.visualizer.IFrame(instance, title, args,view);
                    break;

                case ep.visualizer.Properties.KEY: 
                    control = new ep.visualizer.Properties(instance, title, args,view);
                    break;

                case ep.visualizer.Data.KEY:
                    control = new ep.visualizer.Data(instance, title, args,view);
                    break;

                default:
                    qx.dev.Debug.debugObject(visualizer, 'Can not handle ');
            }
            return control;
        }
    },

    members : {
        _view: null,
        _instance: null,
        _userCfg: null,
        _cfgForm: null,
        _cfgArea: null,
        /**
         * Unhook this visualizer from external influence (eg changeing selection of items in the view table)
         * Override in childs
         */
        unhook : function(){},

        /**
         * setUserCfg set the user accessible bits of the configuration. If the _cfgForm
         * member is set, its setData method will be called.
         * 
         * @param cfg {Map} visualizer spacific  argument list.
         */
        setUserCfg: function(map){
            if (this._cfgForm){
                this._cfgForm.setData(map);
            }
        },

        /**
         * Configure the visualizer. This must be overridden in the child code.
         *
         * @param newArgs {Map} old args
         * @param oldArgs {Map} new args
         * @return {void} 
         */
        _applyArgs : function(newArgs, oldArgs) {
            this.setRecIds(qx.lang.Array.clone(newArgs.recIds));
            this._instance = newArgs.instance;
        },

        /**
         * config map for this visulizer. try to actually copy the stuff so that
         * we do not end up with links.
         *
         * @return {void} 
         */
        getVizualizerConfig: function(){
            var cfg = {
                instance: this.getInstance(),
                recIds: qx.lang.Array.clone(this.getRecIds()),
                userCfg: qx.lang.Object.clone(this._userCfg)
            };
            return cfg;                
        },
        /**
         * Create a weblink for this visualizer
         *
         * @return {void} 
         */
        buildLink: function(){
            var link = 'instance='+this.getInstance();
            if (this.getRecIds()){
                link += ';recIds=' + this.getRecIds().join(',');
            }
            if (this._userCfg){
                for (var prop in this._userCfg){
                    link += ';'+ prop + '=' + encodeURIComponent(this._userCfg[prop]);
                }
            }
            return link;                
        }
    }
});
