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

  // Draw seamline
  if (!options.draftWithCurvedHem) {
    paths.hemBase = new Path().move(points.cfHem).line(points.hem).hide()
  } else {
    paths.hemBase = new Path()
      .move(points.cfHem)
      .curve(points.cfHemCp2, points.hemCp1, points.hem)
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

  var underArmSleeveLength = points.lowerSleeve.dist(points.armhole)
  var lenth2 = points.sleeveBottomMin.dist(points.armhole)

  if (!options.draftWithWingedSleeve) {
    points.underArmCurveStart = paths.sideSeam.reverse().shiftAlong(lenth2)

    points.sleeveBottomMinCp1 = points.sleeveBottomMin.shift(
      // points.sleeveBottomMin.angle(points.sleeveTopMin) + 90,
      points.wristBottom.angle(points.sleeveBottomMin),
      (points.sleeveBottomMin.dist(points.armhole) * 2) / 3
    )

    points.underArmCurveStartCp2 = paths.sideSeam
      .split(points.underArmCurveStart)[0]
      .shiftFractionAlong(0.995) //trust me
      .shiftOutwards(
        points.underArmCurveStart,
        points.sleeveBottomMin.dist(points.sleeveBottomMinCp1)
      )

    paths.sideSeam = paths.sideSeam
      .split(points.underArmCurveStart)[0]
      .curve(points.underArmCurveStartCp2, points.sleeveBottomMinCp1, points.sleeveBottomMin)
      .line(points.sleeveBottomMin)
      .line(points.lowerSleeve)
      .hide()
  } else {
    points.underArmCurveStart = paths.sideSeam.reverse().shiftAlong(underArmSleeveLength)
    points.sleeveBottomCp1 = points.lowerSleeve.shift(
      points.lowerSleeve.angle(points.upperSleeve) + 90,
      (points.lowerSleeve.dist(points.armhole) * 2) / 3
    )

    points.underArmCurveStartCp2 = paths.sideSeam
      .split(points.underArmCurveStart)[0]
      .shiftFractionAlong(0.995) //trust me
      .shiftOutwards(points.underArmCurveStart, points.lowerSleeve.dist(points.sleeveBottomCp1))

    paths.sideSeam = paths.sideSeam
      .split(points.underArmCurveStart)[0]
      .curve(points.underArmCurveStartCp2, points.sleeveBottomCp1, points.lowerSleeve)
      .hide()
  }
  paths.seamSleeveFront = new Path().move(points.lowerSleeve).line(points.upperSleeve).hide()

  paths.saBase = new Path()
    .move(points.shoulder)
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
    .join(paths.sideSeam)
    .join(paths.seamSleeveFront)
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
      .join(paths.seamSleeveFront.offset(sa * 2))
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
