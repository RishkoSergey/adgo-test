import React, { Component } from 'react';
import axios from '../utils/axios';
import { differenceWith } from 'lodash';
import Select from 'react-select';
import dateToString from '../utils/dateToString';
import stringToDate from '../utils/stringToDate';
import getPaginationArray from '../utils/getPaginationArray';
import DatePicker from 'react-datepicker';
import { Table, DropdownButton, Dropdown, Pagination } from 'react-bootstrap';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentList: [],
      from: '2019-07-01',
      to: '2019-08-01',
      currentGroup: {},
      groupsList: [],
      browsersList: [], 
      currentBrowser: [], 
      operatingSystemsList: [],
      currentOperatingSystem: [],
      platformsList: [],
      currentPlatform: {},
      limit: 10,
      offset: 0,
      total: {},
      array: [],
    }
  }

  componentDidMount() {
    axios.get('/groups').then(res => {
      this.setState({ groupsList: res.data }); 
      this.setState({ currentGroup: this.state.groupsList[0] }); 
      axios.get(`/statistics?groupBy=${this.state.currentGroup.value}&from=${this.state.from}&to=${this.state.to}&limit=${this.state.limit}`)
      .then(res => {
        this.setState({ currentList: res.data.rows });
        this.setState({ array: getPaginationArray(res.data.count, this.state.limit) });
        this.setState({ total: res.data.total });
      });
    });
    axios.get('/platforms').then(res => this.setState({ platformsList: res.data }));
    axios.get('/browsers').then(res => this.setState({ browsersList: res.data }));
    axios.get('/operating-systems').then(res => this.setState({ operatingSystemsList: res.data }));
  }

  componentDidUpdate() {
    const params = {
      groupBy: this.state.currentGroup.value,
      from: this.state.from,
      to: this.state.to,
      platform: this.state.currentPlatform.value,
      browsers: this.state.currentBrowser.map(br => br.value),
      operatingSystems: this.state.currentOperatingSystem.map(sys => sys.value),
      limit: this.state.limit,
      offset: this.state.offset,
    }

    Object.keys(params).forEach(name => {
      if ((params[name] === undefined) || (params[name] === [])) delete params[name];
    })
    axios.get('/statistics', { params }).then(res => {
        if (differenceWith(this.state.currentList, res.data.rows, _.isEqual).length) {
          this.setState({ currentList: res.data.rows });
          this.setState({ array: getPaginationArray(res.data.count, this.state.limit) });
          this.setState({ total: res.data.total });
        }  
      });
  }
  render() {
    const { currentList, groupsList, currentGroup, from, to, platformsList, currentPlatform, total,
      browsersList, operatingSystemsList, array } = this.state;
    let actualBrowsersList = [];
    if (currentPlatform.value) {
      actualBrowsersList = browsersList.filter(browser => browser.platform === currentPlatform.value);
    }
    else { actualBrowsersList = browsersList };
    let actualSystemsList = [];
    if (currentPlatform.value) {
      actualSystemsList = operatingSystemsList.filter(system => system.platform === currentPlatform.value);
    }
    else { actualSystemsList = operatingSystemsList };
    return(
      <div>
        <div className="menu">
          <DatePicker 
            maxDate={stringToDate(to)} 
            selected={stringToDate(from)} 
            onChange={date => this.setState({from: dateToString(date)})}
          />
          <DatePicker 
            minDate={stringToDate(from)} 
            selected={stringToDate(to)}
            onChange={date => this.setState({to: dateToString(date)})} 
          />
          <DropdownButton id="group" title={currentGroup.label}>
            {groupsList.map(group => {
              return (
                <Dropdown.Item onSelect={() => {
                  this.setState({ currentGroup: group });
                }}>{group.label}</Dropdown.Item>
              )
            })}
          </DropdownButton>
          <DropdownButton id="platform" title={currentPlatform.label || 'choose platform'}>
            {platformsList.map(platform => {
              return (
                <Dropdown.Item onSelect={() => {
                  this.setState({ currentPlatform: platform });
                  this.setState({ currentBrowser: [] });
                  this.setState({ currentOperatingSystem: [] });
                }}>{platform.label}</Dropdown.Item>
              )
            })}
          </DropdownButton>
        </div>
          <Select
            placeholder="choose browsers"
            isMulti
            name="select"
            onChange={(ev) => this.setState({ currentBrowser: ev || [] })}
            options={actualBrowsersList}
            className="select"
          />
          <Select
            placeholder="choose operating systems"
            isMulti
            name="select"
            onChange={(ev) => this.setState({ currentOperatingSystem: ev || [] })}
            options={actualSystemsList}
            className="select"
          />

        <div className="total">
          <h5>Summary:</h5>
          <div className="data">
            {Object.keys(total).map(elem => {
              return (
              <div>
                <strong>{elem}</strong> : {total[elem]}
              </div>
            )})}
          </div>
        </div>

        <Table striped bordered hover>
          <thead>
            <tr>
              <th>{this.state.currentGroup.label}</th>
              <th>Impressions</th>
              <th>Conversions</th>
              <th>Money</th>
            </tr>
          </thead>
          <tbody>
            {currentList.map(row => {
              return (
              <tr>
                <td>{row[this.state.currentGroup.value]}</td>
                <td>{row.impressions}</td>
                <td>{row.clicks}</td>
                <td>{row.money}</td>
              </tr>)
            })}
          </tbody>
        </Table>
        <Pagination>
          {array.map(item => {
            return (
              <Pagination.Item onClick={() => this.setState({ offset: item })} active={item === this.state.offset}>
                {item+1}
              </Pagination.Item> 
            )
          })}
        </Pagination>
      </div>
    )
  }
}

export default App;