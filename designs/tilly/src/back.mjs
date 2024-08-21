import { front } from './front.mjs'

function tillyBack({
  store,
  sa,
  Point,
  points,
  Path,
  paths,
  options,
  macro,
  utils,
  units,
  measurements,
  part,
}) {
  // Adjust neckline
  points.cbNeck = new Point(0, points.neck.y + options.backNeckCutout * measurements.neck)
  points.cbNeckCp1 = points.cbNeck.shift(0, points.neck.x / 2)
  points.neckCp2 = utils.beamIntersectsY(points.neck, points.neckCp2, points.cbNeck.y)
  let offset = 30

  // Adjust armhole
  points.shoulderCp1 = points.shoulderCp1.shiftFractionTowards(points.shoulder, 0.25)

  //adjust shhoulder
  //points.shoulder = points.shoulder.shift(measurements.shoulderSlope, 30)

  // need new Points
  // first half sleeve lenth lenght:
  let halfLengh = (offset * (1 + options.sleeveHemLength)) / 2
  points.halfLoverSleeve = points.armhole.shift(45, halfLengh)
  points.halfLoverSleeve2 = points.halfLoverSleeve.shift(-45, halfLengh)
  points.shoulderCp1 = points.shoulder
    .shiftTowards(points.neck, points.shoulder.dy(points.armholePitch) / 1)
    .rotate(90, points.shoulder)
  points.armholeCp2 = points.armhole.shift(180, points._tmp1.dx(points.armhole) / 20)

  // Draw seamline
  //paths.hemBase = new Path().move(points.cfHem).line(points.hem).hide()

  // Draw seamline
  if (!options.draftWithCurvedHem) {
    paths.hemBase = new Path().move(points.cfHem).line(points.hem).hide()
  } else {
    var cuvedHemLenth = 65 * (1 + options.curvedHemLenght)
    var midPoint = new Point(points.hem.x / 2, points.hem.y + cuvedHemLenth / 4)
    var nMidPoint = new Point(points.cfHem.x, points.hem.y + cuvedHemLenth)
    points.cfHem = nMidPoint
    var lenth = points.hem.dx(points.cfHem)
    paths.hemBase = new Path()
      .move(points.cfHem)
      .line(nMidPoint)
      //._curve( midPoint, points.hem)
      .curve(points.hem.shift(90, lenth / 4), midPoint, points.hem)
      //._curve( midPoint.shift(35, lenth/4), points.hem.shift(180-35, -lenth/4), points.hem)
      .hide()
  }

  if (options.fitWaist) {
    paths.sideSeam = new Path()
      .move(points.hem)
      .curve(points.hipsCp2, points.waistCp1, points.waist)
      .curve_(points.waistCp2, points.armhole)
      .hide()
  } else {
    paths.sideSeam = new Path().move(points.hem).curve_(points.waistCp2, points.armhole).hide()
  }

  paths.mkArmhole = new Path()
    .move(points.armhole)
    .curve(points.armholeCp2, points.shoulderCp1, points.shoulder)
    .attr('class', 'fabric help')

  paths.sleeveFoldLine = new Path()
    .move(points.halfLoverSleeve)
    .curve(
      points.armholeCp2.shift(30, halfLengh),
      points.shoulderCp1.shift(-measurements.shoulderSlope, halfLengh),
      points.shoulder.shift(-measurements.shoulderSlope, halfLengh)
    )
    .attr('class', 'fabric lashed')

  paths.seamSleeve = new Path()
    .move(points.armhole)
    .line(points.halfLoverSleeve)
    .line(points.halfLoverSleeve2)
    .curve(
      points.armholeCp2.shift(0, halfLengh * 2),
      points.shoulderCp1.shift(0, halfLengh * 2),
      points.shoulder.shift(-measurements.shoulderSlope, halfLengh * 2)
    )
    .line(points.shoulder)
    .hide()
  paths.seamSleeve.trim()

  paths.saBase = new Path()
    .move(points.shoulder)
    //.curve(points.armholeCp2, points.halfLoverSleeve, points.armholeHollow)
    //.curve(points.armholeHollowCp2, points.shoulderCp1, points.shoulder)
    .line(points.neck)
    .curve(points.neckCp2, points.cbNeckCp1, points.cbNeck)
    .hide()

  paths.te = paths.sideSeam.clone()
  paths.te.join(paths.seamSleeve.clone())
  paths.te.attr('class', 'fabric sa')
  paths.te.offset(10)

  paths.seam = new Path()
    .move(points.cfHem)
    .join(paths.hemBase)
    //.join(paths.te)
    .join(paths.sideSeam)
    .join(paths.seamSleeve)
    .join(paths.saBase)
    .line(points.cfHem)
    .close()
    .setClass('fabric')

  if (sa) {
    paths.sa = new Path()
      .move(points.cfHem)
      .join(paths.hemBase.offset(sa * 3))
      .join(paths.sideSeam.offset(sa))
      .join(paths.seamSleeve.offset(sa))
      .join(paths.saBase.offset(sa))
      .line(points.cbNeck)
    paths.sa = paths.sa.trim().attr('class', 'fabric sa')
  }

  // Set store values required to draft sleevecap
  else store.set('sleevecapEase', 0)
  store.set(
    'backArmholeLength',
    new Path()
      .move(points.armhole)
      .curve(points.armholeCp2, points.armholeHollowCp1, points.armholeHollow)
      .curve(points.armholeHollowCp2, points.shoulderCp1, points.shoulder)
      .length()
  )

  // Let the user know how long the neck opening is
  store.flag.info({
    msg: 'tilly:neckOpeningLength',
    replace: {
      length: units(
        store.get('lengthFrontNeckOpening') +
          2 *
            new Path()
              .move(points.neck)
              .curve(points.neckCp2, points.cbNeckCp1, points.cbNeck)
              .length()
      ),
    },
  })

  /*
   * Annotations
   */
  // Cutlist
  store.cutlist.setCut({ cut: 1, from: 'fabric', onFold: true })

  // Cutonfold
  macro('cutonfold', {
    from: points.cfNeck,
    to: points.cfHem,
    grainline: true,
  })

  // Title
  macro('title', {
    at: points.title,
    nr: 2,
    title: 'back',
    notes: 'fold here:   __ __ __ \n sleeve help line:  _ ___ _ ',
  })

  // Scalebox
  points.scaleboxAnchor = points.scalebox = points.title.shift(90, 100)
  macro('scalebox', { at: points.scalebox })

  // Dimensions
  macro('vd', {
    id: 'hHemToNeck',
    from: points.cbHem,
    to: points.cbNeck,
    x: points.cbHem.x - sa - 15,
  })

  // Dimensions
  macro('vd', {
    id: 'chestWisth',
    to: points.armhole,
    from: new Point(points.cfNeck.x, points.armhole.y),
    y: points.armhole.x - sa - 15,
  })

  macro('vd', {
    id: 'neckToSlope',
    from: points.neck,
    to: points.shoulder,
    y: points.shoulder.y - 15,
  })

  return part
}

export const back = {
  name: 'tilly.back',
  from: front,
  draft: tillyBack,
}
