$(document).ready(function() {
  $.fn.editable.defaults.mode = 'inline';
});

var MonitorRow = React.createClass({
  componentDidMount: function() {
    $(this.refs.editable.getDOMNode()).editable()
  },

  doDelete: function() {
    $.post("/monitor/delete", {host: this.props.monitorConfig.host}, function(result) {
      this.props.table.deleteMonitor(this.props.monitorConfig.host);
    }.bind(this));
  },

  render: function() {
    return (
      <tr>
        <td><span className="glyphicon glyphicon-remove delete-icon" onClick={this.doDelete}></span></td>
        <td>{this.props.monitorConfig.host}</td>
        <td><a href="#" ref="editable" name="url" data-type="text" data-pk={this.props.monitorConfig.host} data-url="/monitor" data-title="Monitor URL">{this.props.monitorConfig.url}</a></td>
      </tr>
    );

  }
});

var MonitorTable = React.createClass({
  getInitialState: function() {
    return {
      monitorConfigs: []
    };
  },

  componentDidMount: function() {
    $.get("/monitors", function(result) {
      if (this.isMounted()) {
        this.setState({
          monitorConfigs: result.monitorConfigs
        })
      }
    }.bind(this));
  },

  deleteMonitor: function(host) {
    var monitorConfigs = this.state.monitorConfigs.slice(0);

    for (var i in monitorConfigs) {
      if (monitorConfigs[i].host === host) {
        monitorConfigs.splice(i, 1);
        break;
      }
    }

    this.setState({
      monitorConfigs: monitorConfigs
    });
  },

  render: function() {
    var rows = [];
    this.state.monitorConfigs.forEach(function(monitorConfig) {
      rows.push(<MonitorRow key={monitorConfig.host} table={this} monitorConfig={monitorConfig} />);
    }.bind(this));

    return (
      <table className="table table-bordered">
        <thead>
          <tr>
            <th width="0"></th>
            <th width="50%">Host</th>
            <th width="50%">URL</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    );
  }
});

React.render(
  <MonitorTable />,
  document.getElementById('example')
);
