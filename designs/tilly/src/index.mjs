import { Design, mergeI18n } from '@freesewing/core'
import { data } from '../data.mjs'
import { i18n as brianI18n } from '@freesewing/brian'
import { i18n as tillyI18n } from '../i18n/index.mjs'
import { back } from './back.mjs'
import { front } from './front.mjs'

// Setup our new design
const Tilly = new Design({
  data,
  parts: [back, front],
})

// Merge translations
const i18n = mergeI18n([brianI18n, tillyI18n], {
  o: { drop: ['sleeveLengthBonus'] },
})
//i18n
// Named exports
export { back, front, Tilly, i18n }
