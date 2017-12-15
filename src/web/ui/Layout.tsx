import * as React from 'react'

export interface ILayoutProps {
  onHomeClick: () => void
}

export const HeaderLayout: React.StatelessComponent<ILayoutProps> = props => {

  return (
    <div className="frame">
      <div className="header">
        <i className="ski ski-skedulo header__logo" onClick={ props.onHomeClick } />
        <div className="header__text">Skedulo Connected Pages</div>
        {/* Harish: you might want to use this https://dev.phoenix.test.skl.io/ui/dropdowns */ }
        <div className="header__actions">
          <div className="sked-dropdown">
            <div className="header__user">
              HS
            </div>
            { /* <div className="sked-dropdown-menu sked-dropdown-menu--with-top-right-arrow right">
              <div className="menu-body-links">
                <div className="dropdown-item">Harish Sked</div>
                <div className="dropdown-item">Skedulo Dev</div>
              </div>

            </div>
            */ }
          </div>
        </div>
      </div>
      <div className="content">
        { props.children }
      </div>
    </div>
  )
}

export interface IContentProps {
  centered?: boolean
}

export const ContentLayout: React.StatelessComponent<IContentProps> = props => {

  return (
    <div data-sk-name="content" className={ props.centered ? 'content__center text-center' : 'padding' } >
      { props.children }
    </div>
  )
}
