import _ from 'lodash/fp'
import React, { Component, PropTypes } from 'react'
import { findDOMNode } from 'react-dom'
import { Link, routerShape } from 'react-router'

import pkg from 'package.json'
import { typeOrder, parentComponents, repoURL } from 'docs/app/utils'
import { keyboardKey, META } from 'src/lib'
import Logo from 'docs/app/Components/Logo/Logo'
import {
  Menu,
  Icon,
  Input,
} from 'src'

const getRoute = (_meta) => `/${_meta.type}s/${_.kebabCase(_meta.name)}`

const MenuItem = ({ meta, children, ...rest }) => (
  <Link to={getRoute(meta)} {...rest}>
    {children || meta.name}
  </Link>
)
MenuItem.propTypes = {
  activeClassName: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
  meta: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
}
MenuItem.defaultProps = {
  activeClassName: 'active',
  className: 'item',
}
const selectedItemLabel = <span style={{ color: '#35bdb2', float: 'right' }}>Press Enter</span>

export default class Sidebar extends Component {
  static contextTypes = {
    router: routerShape,
  }
  static propTypes = {
    style: PropTypes.object,
  }
  state = { query: '' }
  filteredComponents = parentComponents

  componentDidMount() {
    document.addEventListener('keydown', this.handleDocumentKeyDown)
    this.setSearchInput()
  }

  componentDidUpdate(prevProps, prevState) {
    this.setSearchInput()
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleDocumentKeyDown)
  }

  setSearchInput() {
    this._searchInput = findDOMNode(this).querySelector('.ui.input input')
  }

  handleDocumentKeyDown = (e) => {
    const code = keyboardKey.getCode(e)
    const isAZ = code >= 65 && code <= 90
    const hasModifier = e.altKey || e.ctrlKey || e.metaKey
    const bodyHasFocus = document.activeElement === document.body

    if (!hasModifier && isAZ && bodyHasFocus) this._searchInput.focus()
  }

  handleItemClick = () => {
    const { query } = this.state

    if (query) this.setState({ query: '' })
    if (document.activeElement === this._searchInput) this._searchInput.blur()
  }

  handleSearchChange = e => this.setState({
    selectedItemIndex: 0,
    query: e.target.value,
  })

  handleSearchKeyDown = e => {
    const { router } = this.context
    const { selectedItemIndex } = this.state
    const code = keyboardKey.getCode(e)

    if (code === keyboardKey.Enter && this.selectedRoute) {
      e.preventDefault()
      router.push(this.selectedRoute)
      this.selectedRoute = null
      this._searchInput.blur()
      this.setState({ query: '' })
    }

    if (code === keyboardKey.ArrowDown) {
      e.preventDefault()
      const next = _.min([selectedItemIndex + 1, this.filteredComponents.length - 1])
      this.selectedRoute = getRoute(this.filteredComponents[next]._meta)
      this.setState({ selectedItemIndex: next })
    }

    if (code === keyboardKey.ArrowUp) {
      e.preventDefault()
      const next = _.max([selectedItemIndex - 1, 0])
      this.selectedRoute = getRoute(this.filteredComponents[next]._meta)
      this.setState({ selectedItemIndex: next })
    }
  }

  menuItemsByType = _.map((type) => {
    const items = _.flow(
      _.filter(META.isType(type)),
      _.map(({ _meta }) => (
        <Menu.Item
          key={_meta.name}
          name={_meta.name}
          onClick={this.handleItemClick}
          as={Link}
          to={getRoute(_meta)}
        />
      ))
    )(parentComponents)

    return (
      <Menu.Item key={type}>
        <Menu.Header>{_.capitalize(type)}s</Menu.Header>
        <Menu.Menu>{items}</Menu.Menu>
      </Menu.Item>
    )
  }, typeOrder)

  renderSearchItems = () => {
    const { selectedItemIndex, query } = this.state
    if (!query) return

    let itemIndex = -1
    const startsWithMatches = []
    const containsMatches = []

    _.each(component => {
      if (new RegExp(`^${_.escapeRegExp(query)}`, 'i').test(component._meta.name)) {
        startsWithMatches.push(component)
      } else if (new RegExp(_.escapeRegExp(query), 'i').test(component._meta.name)) {
        containsMatches.push(component)
      }
    }, parentComponents)

    this.filteredComponents = [...startsWithMatches, ...containsMatches]
    const menuItems = _.map(({ _meta }) => {
      itemIndex++
      const isSelected = itemIndex === selectedItemIndex

      if (isSelected) this.selectedRoute = getRoute(_meta)

      return (
        <Menu.Item
          key={_meta.name}
          name={_meta.name}
          onClick={this.handleItemClick}
          active={isSelected}
          as={Link}
          to={getRoute(_meta)}
        >
          {_meta.name}
          {isSelected && selectedItemLabel}
        </Menu.Item>
      )
    }, this.filteredComponents)

    return <Menu.Menu>{menuItems}</Menu.Menu>
  }

  render() {
    const { style } = this.props
    const { query } = this.state
    return (
      <Menu vertical fixed='left' inverted style={{ ...style }}>
        <Menu.Item>
          <Logo spaced='right' size='mini' />
          <strong>
            Semantic-UI-React &nbsp;
            <small><em>{pkg.version}</em></small>
          </strong>
        </Menu.Item>
        <Menu.Item>
          <Menu.Header>Getting Started</Menu.Header>
          <Menu.Menu>
            <Menu.Item as={Link} to='/introduction' activeClassName='active'>
              Introduction
            </Menu.Item>
            <Menu.Item as={Link} to='/usage' activeClassName='active'>
              Usage
            </Menu.Item>
            <Menu.Item as='a' href={repoURL}>
              <Icon name='github' /> GitHub
            </Menu.Item>
            <Menu.Item as='a' href={`${repoURL}/blob/master/CHANGELOG.md` }>
              <Icon name='file text outline' /> CHANGELOG
            </Menu.Item>
          </Menu.Menu>
        </Menu.Item>
        <Menu.Item>
          <Input
            className='transparent inverted icon'
            icon='search'
            placeholder='Start typing...'
            value={query}
            onChange={this.handleSearchChange}
            onKeyDown={this.handleSearchKeyDown}
          />
        </Menu.Item>
        {query ? this.renderSearchItems() : this.menuItemsByType}
      </Menu>
    )
  }
}
