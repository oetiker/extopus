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
    extend : qx.ui.core.Widget,
    type : 'abstract',
    /**
     * create a visualization widget with the given title.
     * 
     * @param title {String} title to display on the tab
     * @param args {Map} argument map for the view.
     * @param table {String} the view table    
     */
    construct : function(title,args,view) {
        this.base(arguments);
        this.setTitle(title);
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
        recIds: {}
    },
    statics: {
       /**
         * Create new a visualizer widget according to the given configuration. At first glance the configuration
         * map has a <code>title</code>, <code>caption</code> and <code>arguments</code> property.
         *
         * @param vizMap {Map} visualizer configuration map
         * @return {Widget} visualizer widget
         */
        createVisualizer : function(key,title,args,view) {
            var control;
            switch(key)
            {
                case ep.visualizer.Chart.KEY:  
                    control = new ep.visualizer.Chart(title, args,view);
                    break;

                case ep.visualizer.MultiData.KEY:
                    control = new ep.visualizer.MultiData(title, args,view);
                    break;

                case ep.visualizer.IFrame.KEY:
                    control = new ep.visualizer.IFrame(title, args,view);
                    break;

                case ep.visualizer.Properties.KEY: 
                    control = new ep.visualizer.Properties(title, args,view);
                    break;

                case ep.visualizer.Data.KEY:
                    control = new ep.visualizer.Data(title, args,view);
                    break;

                default:
                    qx.dev.Debug.debugObject(key, 'Can not handle ');
            }
            return control;
        }
    },

    members : {
        _view: null,
        _vizKey: null,
        _userCfg: null,
        _cfgForm: null,
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
            this.setRecIds(newArgs.recIds.join(','));
        },

        /**
         * Create a linkable argument for this image
         *
         * @return {void} 
         */
        buildLink: function(){
            var link = 'app='+this._vizKey;
            if (this.getRecIds()){
                link += ';recIds=' + this.getRecIds();
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
