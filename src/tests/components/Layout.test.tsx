import * as React from 'react'
import { mount } from 'enzyme'
import { HeaderLayout, ContentLayout } from '../../web/ui/Layout'

describe('Layout', () => {
  describe('Header', () => {

    test('renders children', () => {

      const onHomeClick = jest.fn()
      const childText = 'Hello World'

      const wrapper = mount(
        <HeaderLayout onHomeClick={ onHomeClick }>{ childText }</HeaderLayout>
      )

      expect(wrapper.find('.content').text()).toEqual(childText)
      expect(onHomeClick.mock.calls).toEqual([])

      wrapper.unmount()
    })

    test('calls home callback fn when logo is clicked', () => {

      const onHomeClick = jest.fn()

      const wrapper = mount(
        <HeaderLayout onHomeClick={ onHomeClick }>Hello World</HeaderLayout>
      )

      expect(onHomeClick.mock.calls.length).toEqual(0)

      wrapper.find('.ski-skedulo').first().simulate('click')
      expect(onHomeClick.mock.calls.length).toEqual(1)

      wrapper.find('.ski-skedulo').first().simulate('click')
      expect(onHomeClick.mock.calls.length).toEqual(2)

      wrapper.find('.ski-skedulo').first().simulate('click')
      expect(onHomeClick.mock.calls.length).toEqual(3)

      wrapper.unmount()
    })
  })

  describe('Content', () => {

    test('renders children', () => {

      const childText = 'Hello World'

      const wrapper = mount(
        <ContentLayout>{ childText }</ContentLayout>
      )

      expect(wrapper.find('[data-sk-name="content"]').text()).toEqual(childText)

      wrapper.unmount()
    })

    test('renders with default class', () => {

      const childText = 'Hello World'

      const wrapper = mount(
        <ContentLayout>{ childText }</ContentLayout>
      )

      expect(wrapper.find('[data-sk-name="content"]').text()).toEqual(childText)
      expect(wrapper.find('.content__center.text-center').length).toEqual(0)
      expect(wrapper.find('.padding').length).toEqual(1)

      wrapper.unmount()
    })

    test('centers content', () => {

      const childText = 'Hello World'

      const wrapper = mount(
        <ContentLayout centered>{ childText }</ContentLayout>
      )

      expect(wrapper.find('[data-sk-name="content"]').text()).toEqual(childText)
      expect(wrapper.find('.content__center.text-center').length).toEqual(1)
      expect(wrapper.find('.padding').length).toEqual(0)

      wrapper.unmount()
    })
  })
})
