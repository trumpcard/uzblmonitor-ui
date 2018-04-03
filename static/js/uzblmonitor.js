var React = require("react"),
    ReactDOM = require("react-dom"),
    Select = require('react-select'),
    RIEInput = require("riek").RIEInput,
    Fluxxor = require("fluxxor");

window.React = React;

var SUPPORTED_OPTIONS = [
    { value: 'horizontal', label: 'Horizontal Split', placeholder: 'A value between 0 and 1' },
    { value: 'vertical', label: 'Vertical Split', placeholder: 'A value between 0 and 1' },
    { value: 'url', label: 'URL', placeholder: 'URL (must begin with http or https)' },
    { value: 'terminal', label: 'Command', placeholder: 'Command' }
];
var constants = {
  'MONITORS_LOADED': 'MONITORS_LOADED'
};

var AppStore = Fluxxor.createStore({
    initialize: function() {
        this.monitors = [];
        this.bindActions(
            constants.MONITORS_LOADED, this.onMonitorsLoaded
        )
    },
    onMonitorsLoaded: function(data) {
        this.monitors = data;
        this.emit('change');
    },
    getState: function() {
        return {
            monitors: this.monitors
        };
    }
});


var stores = {AppStore: new AppStore()};
var actions = {
    loadMonitors: function() {
      var self = this;
      $.ajax({
          url: "/monitors",
          success: function (data, textStatus, jqXHR) {
              data.monitors.sort(function(a,b) {return (a.alias > b.alias) ? 1 : ((b.alias > a.alias) ? -1 : 0);} );
              self.dispatch(constants.MONITORS_LOADED, data.monitors);
          }
      });
    },
    updateMonitor: function(host, state) {
      var self = this;
      $.ajax({
          url: "/monitor/update",
          method: 'POST',
          data: {
            host: host,
            state: JSON.stringify(state)
          },
          success: function (data, textStatus, jqXHR) {
            console.log("Saved!")
          }
      });
    },
    updateAlias: function(host, value) {
      var self = this;
      $.ajax({
          url: "/monitor/update_alias",
          method: 'POST',
          data: {
            host: host,
            value: value
          },
          success: function (data, textStatus, jqXHR) {
            console.log("Saved!")
          }
      });
    },
    updateRefreshRate: function(host, value) {
      var self = this;
      $.ajax({
          url: "/monitor/update_refresh_rate",
          method: 'POST',
          data: {
            host: host,
            value: value
          },
          success: function (data, textStatus, jqXHR) {
            console.log("Saved!")
          }
      });
    },
    refreshMonitor: function(host) {
      var self = this;
      $.ajax({
          url: "/monitor/refresh",
          method: 'POST',
          data: {
            host: host,
          },
          success: function (data, textStatus, jqXHR) {
            console.log("Refreshed!")
          }
      });
    }
};

var flux = new Fluxxor.Flux(stores, actions);

window.flux = flux;

flux.on("dispatch", function(type, payload) {
    if (console && console.log) {
        console.log("[Dispatch]", type, payload);
    }
});


var FluxMixin = Fluxxor.FluxMixin(React),
    StoreWatchMixin = Fluxxor.StoreWatchMixin;


var Form = React.createClass({
    displayName: "Form",
    mixins: [FluxMixin],
    getInitialState: function() {
        return {value: this.props.value}
    },
    onChange: function(e) {
        e.persist();
        this.setState({value: e.target.value}, function(){
          this.props.onChange(this.state.value);
        });

    },
    render: function() {
        return (
          <input className="form-control" type="text" onChange={this.onChange} value={this.state.value} placeholder={this.props.placeholder} />
        );
    }
});

var ModeDropdown = React.createClass({
  displayname: "ModeDropdown",
  mixins: [FluxMixin],
  getInitialState: function() {
    if (this.props.state) {
      return {
        mode: this.props.state.mode,
        value: this.props.state.value,
        children: this.props.state.children || null
      };
    } else {
      return {
        mode: 'url',
        value: '',
        children: null
      };
    }
  },
  onChange: function(value) {
    new_children = [{'mode': 'url', 'value': '', 'children': null}, {'mode': 'url', 'value': '', 'children': null}]
    if(value == 'horizontal') {
      this.setState({mode: "horizontal"}, function() {
        this.props.onStateUpdate(this.state)
      });
    } else if(value == 'vertical') {
      this.setState({mode: "vertical"}, function() {
        this.props.onStateUpdate(this.state)
      });
    } else if(value == 'terminal') {
      this.setState({mode: "terminal", children: null}, function() {
        this.props.onStateUpdate(this.state)
      });
    } else if(value == 'url') {
      this.setState({mode: "url", children: null}, function() {
        this.props.onStateUpdate(this.state)
      });
    }
  },
  updateState: function(state) {
    this.setState(state, function() {
      this.props.onStateUpdate(this.state)
    })
  },
  updateValue: function(value) {
    this.setState({value: value}, function() {
      this.props.onStateUpdate(this.state)
    });
  },
  render: function () {
    var split, hr, placeholder;
    if(this.state.mode == 'horizontal' || this.state.mode == 'vertical') {
      split = <Split state={this.props.state.children} onStateUpdate={this.updateState} mode={this.state.mode}/>;
    } else {
      hr = <hr/>;
    }

    for (var i=0; i < SUPPORTED_OPTIONS.length; ++i) {
      if(this.state.mode == SUPPORTED_OPTIONS[i].value) {
        placeholder = SUPPORTED_OPTIONS[i].placeholder;
      }
    }

    return (
      <div>
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-3">
              <Select value={this.state.mode} searchable={false} clearable={false} options={SUPPORTED_OPTIONS} onChange={this.onChange}/>
            </div>
            <div className="col-md-9">
              <Form onChange={this.updateValue} value={this.state.value} placeholder={placeholder}/>
            </div>
          </div>
          <div className="row">
            {split}
          </div>
        </div>
        {hr}
      </div>
    )
  }
})

var Split = React.createClass({
  displayname: 'Split',
  mixins: [FluxMixin],
  getInitialState: function() {
    if(this.props.state) {
      children = this.props.state;
    } else {
       children = [{'mode': 'url', 'value': '', 'children': null}, {'mode': 'url', 'value': '', 'children': null}]
    }
    return {children: children};
  },
  updateAState: function(state){
    this.setState({children: [state, this.state.children[1]]}, function() {
      this.props.onStateUpdate(this.state)
    })
  },
  updateBState: function(state){
    this.setState({children: [this.state.children[0], state]}, function() {
      this.props.onStateUpdate(this.state)
    })
  },
  render: function () {
    if(this.props.mode == "horizontal") {
      a = "Left";
      b = "Right";
    } else {
      a = "Top";
      b = "Bottom";
    }

    return (
      <div>
        <hr/>
        <div className="row">
          <div className="col-md-1"></div>
          <div className="col-md-11">
            <span className="muted">{a}</span>
            <ModeDropdown state={this.state.children[0]} onStateUpdate={this.updateAState}/>
            <span className="muted">{b}</span>
            <ModeDropdown state={this.state.children[1]} onStateUpdate={this.updateBState}/>
          </div>
        </div>
        <hr/>
      </div>
    )
  }
})

var Host = React.createClass({
  displayName: 'Host',
  mixins: [FluxMixin],
  getInitialState: function() {
    return {
      id: this.props.host.host.replace(/\./g, '_'),
      name: this.props.host.host,
      alias: this.props.host.alias || this.props.host.host,
      refresh_rate: this.props.host.refresh_rate || "infinity",
      state: this.props.host.state
    };
  },
  getStateFromFlux: function() {
    return this.getFlux().store('AppStore').getState();
  },
  updateState: function(state) {
    var self = this;
    this.setState({state: state}, function() {
      self.forceUpdate()
    })
  },
  refresh: function() {
    this.getFlux().actions.refreshMonitor(this.state.name);
  },
  onSave: function() {
    this.getFlux().actions.updateMonitor(this.state.name, this.state.state);
  },
  updateAlias: function(e) {
    this.setState({alias: e.text}, function(){
      this.getFlux().actions.updateAlias(this.state.name, e.text);
    })
  },
  updateRefreshRate: function(e) {
    this.setState({refresh_rate: e.text}, function(){
      this.getFlux().actions.updateRefreshRate(this.state.name, e.text);
    })
  },
  render: function() {
    return (
      <div className="host panel panel-default">
        <div className="panel-heading" role="tab">
          <h4 className="panel-title">
            <a role="button" data-toggle="collapse" data-target={"#" + this.state.id}>
              <i className="glyphicon glyphicon-plus"></i>
              <RIEInput
          value={this.state.alias}
          change={this.updateAlias}
          propName="text"
          classLoading="loading"
          classInvalid="invalid" /> ({this.props.host.host})
            </a>
          </h4>
          <span className="panel-title pull-right">
            <i className="glyphicon glyphicon-refresh refresh-icon" onClick={this.refresh}></i>
            (<RIEInput
          value={this.state.refresh_rate}
          change={this.updateRefreshRate}
          propName="text"
          classLoading="loading"
          classInvalid="invalid" /> sec)
          </span>

        </div>
        <div id={this.state.id} className="panel-collapse collapse" role="tabpanel">
          <div className="panel-body">
            <hr/>
            <ModeDropdown state={this.props.host.state} onStateUpdate={this.updateState}/>
            <div className="container-fluid">
              <button className="pull-right btn btn-success" onClick={this.onSave} type="submit">Save</button>
            </div>
          </div>
        </div>
      </div>
    )
  }
})

var Application = React.createClass({displayName: "Application",
    mixins: [FluxMixin, StoreWatchMixin('AppStore')],

    getInitialState: function() {
        return {};
    },
    componentDidMount: function () {
        this.getFlux().actions.loadMonitors();
    },
    getStateFromFlux: function() {
        return this.getFlux().store('AppStore').getState();
    },
    render: function() {
        return (
          <div className="panel-group" id="accordion" role="tablist" aria-multiselectable="true">
            {this.state.monitors.map(function(host, i){
                return <Host host={host} key={i} />;
            })}
          </div>
        );
    },
});


ReactDOM.render(React.createElement(Application, {flux: flux}), document.getElementById("app"));
