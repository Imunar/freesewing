import { base } from '@freesewing/brian'
import { hidePresets } from '@freesewing/core'

function tillyFront({
  utils,
  store,
  sa,
  Point,
  points,
  Path,
  paths,
  Snippet,
  snippets,
  options,
  measurements,
  macro,
  log,
  units,
  part,
}) {
  // Hide Brian paths
  for (let key of Object.keys(paths)) paths[key].hide()

  // Adapt fit to waist
  if (options.fitWaist) {
    let midWidth, lowerWidth

    midWidth = (measurements.waist * (1 + options.waistEase)) / 4
    lowerWidth = (measurements.hips * (1 + options.hipsEase)) / 4
    points.hem.x = lowerWidth
    points.hips.x = lowerWidth
    points.waist.x = midWidth

    // control points should be somewhat evenly spaced around waist
    let cpAbove, cpBelow
    cpAbove = points.armhole.dy(points.waist) * 0.6
    cpBelow = points.hips.dy(points.waist) * 0.25
    points.waistCp1 = points.waist.shift(90, (cpBelow * 2) / 3 - cpAbove / 3)
    points.waistCp2 = points.waist.shift(90, (cpAbove * 2) / 3 - cpBelow / 3)
    points.hipsCp2 = points.hips.shift(90, points.waist.dy(points.hips) * 0.3)

    // warn if we're making a barrel-shaped shirt
    if (midWidth > lowerWidth) {
      log.warn(
        'width at waist exceeds width at hips; consider disabling the curve to waist option for a more standard shape'
      )
    }
  } else {
    let width
    if (measurements.waist > measurements.hips)
      width = (measurements.waist * (1 + options.hipsEase)) / 4
    else width = (measurements.hips * (1 + options.hipsEase)) / 4
    points.hem.x = width
    points.hips.x = width
    points.waist.x = width
    points.waistCp2 = points.waist.shift(90, points.armhole.dy(points.waist) / 3)
  }

  // Clone cb (center back) into cf (center front)
  for (let key of ['Neck', 'Shoulder', 'Armhole', 'Hips', 'Hem']) {
    points[`cf${key}`] = points[`cb${key}`].clone()
  }

  //adjust shhoulder
  points.shoulder = points.shoulder.shift(+90, 0.07 * measurements.hpsToWaistBack)
  //calc wrist
  points.wristTop = points.neck.shiftOutwards(points.shoulder, measurements.shoulderToWrist)
  //points.wristBottom = points.wristTop.shift(-90, measurements.wrist/2+ 10*options.cuffEase)
  points.wristBottom = points.wristTop.shift(
    points.wristTop.angle(points.shoulder) + 90,
    measurements.wrist * (1 + options.cuffEase) * 0.5
  )

  //now add the lower wrist point
  points.lowerSleeve = points.armhole.shiftFractionTowards(points.wristBottom, options.sleeveLength)
  //and now connect to shoulderseam
  points.upperSleeve = utils.linesIntersect(
    points.lowerSleeve,
    new Point(points.lowerSleeve.x, 0),
    points.wristTop,
    points.shoulder
  )
  //save minimum sleeve point
  points.sleeveBottomMin = points.armhole.shiftFractionTowards(points.wristBottom, 0.07)
  points.sleeveTopMin = utils.linesIntersect(
    points.sleeveBottomMin,
    new Point(points.sleeveBottomMin.x, 0),
    points.wristTop,
    points.shoulder
  )

  // Neckline
  points.cfNeck = new Point(0, options.necklineDepth * measurements.hpsToWaistBack)
  points.cfNeckCp1 = points.cfNeck.shift(0, points.neck.x * options.necklineBend * 2)
  points.neck = points.hps.shiftFractionTowards(points.shoulder, options.necklineWidth)
  points.neckCp2 = points.neck
    .shiftTowards(points.shoulder, points.neck.dy(points.cfNeck) * (0.2 + options.necklineBend))
    .rotate(-90, points.neck)

  // Log info for full length
  store.flag.info({
    msg: 'tilly:fullLengthFromHps',
    replace: { length: units(points.hps.dy(points.hem)) },
  })

  // Store length of neck opening for finish
  store.set(
    'lengthFrontNeckOpening',
    new Path().move(points.neck).curve(points.neckCp2, points.cfNeckCp1, points.cfNeck).length() * 2
  )

  // Draw seamline
  if (!options.draftWithCurvedHem) {
    paths.hemBase = new Path().move(points.cfHem).line(points.hem).hide()
  } else {
    points.cfHem = new Point(points.cfHem.x, points.cfHem.y * (1 + options.curvedHemLenght))
    points.cfHemCp2 = new Point(points.hem.x * 0.8, points.cfHem.y)
    points.hemCp1 = new Point(points.hem.x * 0.55, points.hem.y)

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

  paths.seamSleeve = new Path()
    //.move(points.armhole)
    //.line(points.lowerSleeve)
    //.move(points.lowerSleeve)
    //.line(points.upperSleeve)
    .move(points.upperSleeve)
    .line(points.shoulder)
    .hide()
  /*
paths.seamSleeve = new Path()
  .move(points.armhole)
  .line(points.endOfSleve)
  .line(points.shoulderEndPoint)
  .hide()
  paths.seamSleeve.trim()
  */

  paths.saBase = new Path()
    .move(points.shoulder)
    .line(points.neck)
    .curve(points.neckCp2, points.cfNeckCp1, points.cfNeck)
    .hide()

  paths.seam = new Path()
    .move(points.cfHem)
    .join(paths.hemBase)
    .join(paths.sideSeam)
    .join(paths.seamSleeveFront)
    .join(paths.seamSleeve)
    .join(paths.saBase)
    .line(points.cfHem)
    .close()
    .attr('class', 'fabric')

  if (sa) {
    paths.sa = new Path()
      .move(points.cfHem)
      .join(paths.hemBase.offset(sa * 3))
      .join(paths.sideSeam.offset(sa))
      .join(paths.seamSleeveFront.offset(sa * 2))
      .join(paths.seamSleeve.offset(sa))
      .join(paths.saBase.offset(sa))
      .line(points.cfNeck)

    paths.sa = paths.sa.trim().attr('class', 'fabric sa')
  }

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
  points.title = new Point(points.waist.x / 2, points.waist.y)
  macro('title', {
    at: points.title,
    nr: 1,
    title: 'front',
    notes: 'fold here:   __ __ __ \n sleeve help line:  _ ___ _ ',
  })

  // Logo
  points.logo = points.title.shift(-90, 75)
  snippets.logo = new Snippet('logo', points.logo)

  // Dimensions
  macro('hd', {
    id: 'wAtHem',
    from: points.cfHem,
    to: points.hem,
    y: points.hem.y + sa * 2.5 + 15,
  })
  if (options.fitWaist) {
    macro('hd', {
      id: 'wHemToWaist',
      from: points.waist,
      to: points.hem,
      y: points.hem.y + sa * 2.5 + 30,
    })
    macro('vd', {
      id: 'hHemToWaist',
      from: points.hem,
      to: points.waist,
      x: points.waist.x - 15,
    })
  }
  macro('vd', {
    id: 'hHemToArmhole',
    from: points.hem,
    to: points.armhole,
    x: points.armhole.x + sa + 15,
  })
  macro('vd', {
    id: 'hHemToShoulder',
    from: points.hem,
    to: points.shoulder,
    x: points.armhole.x + sa + 30,
  })
  macro('vd', {
    id: 'hFull',
    from: points.hem,
    to: points.neck,
    x: points.armhole.x + sa + 45,
  })
  macro('hd', {
    id: 'wFoldToHps',
    from: points.cfNeck,
    to: points.neck,
    y: points.neck.y - sa - 15,
  })
  macro('hd', {
    id: 'wFoldToShoulder',
    from: points.cfNeck,
    to: points.shoulder,
    y: points.neck.y - sa - 30,
  })
  /*macro('hd', {
    id: 'cuffsize',
    from: points.shoulderEndPoint,
    to: points.endOfSleve,
    x: points.endOfSleve.y - sa + 30,
  })*/
  macro('hd', {
    id: 'wFull',
    from: points.cfNeck,
    to: points.armhole,
    y: points.neck.y - sa - 45,
  })
  // These dimensions are only for the front
  macro('vd', {
    id: 'hHemToNeck',
    from: points.cfHem,
    to: points.cfNeck,
    x: points.cfHem.x - sa - 15,
  })
  macro('vd', {
    id: 'neckToSlope',
    from: points.neck,
    to: points.shoulder,
    y: points.shoulder.y + 15,
  })

  macro('vd', {
    id: 'armhole',
    from: points.armhole,
    to: points.shoulder,
    y: points.shoulder.y - 15,
  })

  return part
}

export const front = {
  name: 'tilly.front',
  from: base,
  measurements: ['hips', 'waist', 'hpsToBust', 'shoulderToWrist', 'wrist'],
  hide: hidePresets.HIDE_TREE,
  options: {
    bicepsEase: 0.05,
    //shoulderEase: 0,
    collarEase: 0,
    shoulderSlopeReduction: 0,
    sleeveWidthGuarantee: 0.85,
    frontArmholeDeeper: 0.005,
    // Brian overrides
    armholeDepth: { pct: 20.0, min: -10, max: 50, menu: 'advanced' },
    chestEase: { pct: 12, min: 5, max: 50, menu: 'fit' },
    lengthBonus: { pct: 5, min: -20, max: 60, menu: 'style' },
    backNeckCutout: { pct: 8, min: 4, max: 12, menu: 'fit' },
    // tilly specific
    draftWithCurvedHem: { bool: false, menu: 'style' },
    draftWithWingedSleeve: { bool: false, menu: 'style' },

    curvedHemLenght: {
      pct: 13,
      min: 5,
      max: 30,
      menu: (settings, mergedOptions) => (mergedOptions.draftWithCurvedHem ? 'style' : false),
    },
    draftForHighBust: { bool: false, menu: 'fit' },
    fitWaist: { bool: false, menu: 'fit' },
    waistEase: {
      pct: 25,
      min: 8,
      max: 40,
      menu: (settings, mergedOptions) => (mergedOptions.fitWaist ? 'fit' : false),
    },
    hipsEase: { pct: 18, min: 8, max: 70, menu: 'fit' },
    necklineDepth: { pct: 10, min: 10, max: 70, menu: 'style' },
    necklineWidth: { pct: 30, min: 10, max: 50, menu: 'style' },
    necklineBend: { pct: 30, min: 0, max: 70, menu: 'style' },
    shoulderEase: { pct: 30, min: 15, max: 45, menu: 'style' },
    sleeveLength: { pct: 7, min: 7, max: 80, menu: 'style' },
  },
  draft: tillyFront,
}
