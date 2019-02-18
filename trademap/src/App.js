import React, { Component } from 'react'
import { Navbar, Button, Alignment } from '@blueprintjs/core'

import 'normalize.css/normalize.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/core/lib/scss/variables.scss'
import './App.scss'

const { Group, Heading } = Navbar;

class App extends Component {
  render() {
    return (
      <div className="trademap">
        <Navbar fixedToTop>
          <Group align={Alignment.LEFT}>
            <Heading>UK Regions Imports and Exports of Goods by Country and World Region</Heading>
            <h5>This prototype was developed by the Northern Ireland Statistics and Research Agency</h5>
          </Group>
          <Group align={Alignment.RIGHT}>
            About
            Share
          </Group>
        </Navbar>
      </div>
    );
  }
}

export default App;
