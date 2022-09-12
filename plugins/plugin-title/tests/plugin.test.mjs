import chai from 'chai'
import { Design } from '@freesewing/core'
import { plugin } from './dist/index.mjs'

const expect = chai.expect

describe('Title Plugin Tests', () => {
  it('Should run the title macro', () => {
    const part = {
      name: 'test',
      draft: ({ points, Point, macro }) => {
        points.anchor = new pattern.Point(-12, -34)
        macro('title', {
          at: points.anchor,
          nr: 3,
          title: 'unitTest',
        })
      },
    }
    const Pattern = new Design({
      data: { name: 'testPattern', version: 99 },
      parts: [part],
      plugins: [plugin],
    })
    const pattern = new Pattern()
    pattern.draft().render()
    let p = pattern.parts.test.points.__titleNr
    expect(p.x).to.equal(-12)
    expect(p.y).to.equal(-34)
    expect(p.attributes.get('data-text')).to.equal('3')
    expect(p.attributes.get('data-text-class')).to.equal('text-4xl fill-note font-bold')
    expect(p.attributes.get('data-text-x')).to.equal('-12')
    expect(p.attributes.get('data-text-y')).to.equal('-34')
    p = pattern.parts.test.points.__titleName
    expect(p.attributes.get('data-text')).to.equal('unitTest')
    expect(p.attributes.get('data-text-class')).to.equal('text-lg fill-current font-bold')
    expect(p.attributes.get('data-text-x')).to.equal('-12')
    expect(p.attributes.get('data-text-y')).to.equal('-26')
    p = pattern.parts.test.points.__titlePattern
    expect(p.attributes.get('data-text')).to.equal('testPattern v99')
    expect(p.attributes.get('data-text-class')).to.equal('fill-note')
    expect(p.attributes.get('data-text-x')).to.equal('-12')
    expect(p.attributes.get('data-text-y')).to.equal('-18')
  })

  it('Should run the title macro with append flag', () => {
    const part = {
      name: 'test',
      draft: ({ points, Point, macro }) => {
        points.anchor = new pattern.Point(-12, -34).attr('data-text', '#')
        macro('title', {
          at: points.anchor,
          nr: 3,
          title: 'unitTest',
          append: true,
        })
      },
    }
    const Pattern = new Design({
      data: { name: 'testPattern', version: 99 },
      parts: [part],
      plugins: [plugin],
    })
    const pattern = new Pattern()
    pattern.draft().render()
    let p = pattern.parts.test.points.__titleNr
    expect(p.x).to.equal(-12)
    expect(p.y).to.equal(-34)
    expect(p.attributes.get('data-text')).to.equal('# 3')
    expect(p.attributes.get('data-text-class')).to.equal('text-4xl fill-note font-bold')
    expect(p.attributes.get('data-text-x')).to.equal('-12')
    expect(p.attributes.get('data-text-y')).to.equal('-34')
  })

  it('Should run the title macro with point prefix', () => {
    const part = {
      name: 'test',
      draft: ({ points, Point, macro }) => {
        points.anchor = new pattern.Point(-12, -34).attr('data-text', '#')
        macro('title', {
          at: points.anchor,
          nr: 3,
          title: 'unitTest',
          prefix: 'foo',
        })
      },
    }
    const Pattern = new Design({
      data: { name: 'testPattern', version: 99 },
      parts: [part],
      plugins: [plugin],
    })
    const pattern = new Pattern()
    pattern.draft().render()
    let p = pattern.parts.test.points._foo_titleNr
    expect(p.x).to.equal(-12)
    expect(p.y).to.equal(-34)
    expect(p.attributes.get('data-text')).to.equal('3')
    expect(p.attributes.get('data-text-class')).to.equal('text-4xl fill-note font-bold')
    expect(p.attributes.get('data-text-x')).to.equal('-12')
    expect(p.attributes.get('data-text-y')).to.equal('-34')
    p = pattern.parts.test.points._foo_titleName
    expect(p.attributes.get('data-text')).to.equal('unitTest')
    expect(p.attributes.get('data-text-class')).to.equal('text-lg fill-current font-bold')
    expect(p.attributes.get('data-text-x')).to.equal('-12')
    expect(p.attributes.get('data-text-y')).to.equal('-26')
    p = pattern.parts.test.points._foo_titlePattern
    expect(p.attributes.get('data-text')).to.equal('testPattern v99')
    expect(p.attributes.get('data-text-class')).to.equal('fill-note')
    expect(p.attributes.get('data-text-x')).to.equal('-12')
    expect(p.attributes.get('data-text-y')).to.equal('-18')
  })
})
