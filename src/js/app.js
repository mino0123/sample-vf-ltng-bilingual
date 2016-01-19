
const EventEmitter = require('eventemitter3');
const React = require('react');
const ReactDom = require('react-dom');


class BilingualSampleComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      accounts: [],
      connection: props.connection
    };
    this.handleGetAccounts = this._handleGetAccounts.bind(this);
    this.state.connection.on('getAccounts', this.handleGetAccounts);
  }
  componentWillReceiveProps(nextProps) {
    this.state.accounts
  }
  _handleGetAccounts(accounts) {
    this.setState({
      accounts: accounts
    });
  }
  render() {
    var rows = this.state.accounts.map((acc) => {
      return <tr key={acc.Id}><td>{acc.Name}</td></tr>
    });
    var getAccountProcess = (() => {
      this.state.connection.getAccounts();
    }).bind(this);
    return <div>
      <button onClick={getAccountProcess}>Get Accounts</button>
      <br/>
      <table>
        <tbody>{rows}</tbody>
      </table>
    </div>;
  }
};


class ApexConnection extends EventEmitter {
  getAccounts() {
    throw new Error('ApexConnection#getAccounts does not implemented');
  }
};

class WebServiceConnection extends ApexConnection {
  constructor() {
    super();
    this.getAccounts = this._getAccounts.bind(this);
  }
  _getAccounts() {
    var accounts = sforce.apex.execute('minoaw.BilingualSample', 'getAccounts', {});
    this.emit('getAccounts', accounts);
  }
}

class LightningConnection extends ApexConnection {
  constructor(cmp) {
    super();
    this.ltng = cmp;
    this.getAccounts = this._getAccounts.bind(this);
  }
  initLightningCallback() {
    this.callback = $A.getCallback(function () {
      this.emit('callback');
    }.bind(this));
  }
  _getAccounts() {
    var self = this;
    this.once('callback', function () {
      var action = this.ltng.get('c.getAccounts');
      action.setCallback(this.ltng, function (response) {
        if (response.state === 'SUCCESS') {
          self.emit('getAccounts', response.returnValue);
        } else {
          self.emit('error', response.error);
        }
      });
      $A.enqueueAction(action);
    });
    this.callback();
  }
}


window.BilingualSample = {
  initLightning: function (target, ltngCmp) {
    var conn = new LightningConnection(ltngCmp);
    conn.initLightningCallback();
    ReactDom.render(<BilingualSampleComponent connection={conn} />, target);
  },
  initVisualforce: function (target) {
    var conn = new WebServiceConnection();
    ReactDom.render(<BilingualSampleComponent connection={conn} />, target);
  }
};

