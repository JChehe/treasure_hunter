let Container = PIXI.Container
let autoDetectRenderer = PIXI.autoDetectRenderer
let loader = PIXI.loader
let TextureCache = PIXI.TextureCache
let Texture = PIXI.Texture
let Sprite = PIXI.Sprite
let Text = PIXI.Text
let Graphics = PIXI.Graphics

let stage = new Container()
let renderer = autoDetectRenderer(512, 512)
document.body.appendChild(renderer.view)

loader
  .add('./img/atlas.json')
  .load(setup)


let state, explorer, treasure, blobs, chimes, exit, player, dungeon,
  door, healthBar, message, gameScene, gameOverSence, enemies

function setup (loader, resources) {

  gameScene = new Container()
  stage.addChild(gameScene)

  let atlas = resources['./img/atlas.json'].textures

  // Dungeon
  dungeon = new Sprite(atlas['dungeon.png'])
  gameScene.addChild(dungeon)

  // Door
  door = new Sprite(atlas['door.png'])
  door.x = 32
  gameScene.addChild(door)

  // Explorer
  explorer = new Sprite(atlas['explorer.png'])
  explorer.x = 68
  explorer.y = (gameScene.height - explorer.height) / 2
  explorer.vx = 0
  explorer.vy = 0
  gameScene.addChild(explorer)

  // Treasure
  treasure = new Sprite(atlas['treasure.png'])
  treasure.x = gameScene.width - treasure.width - 48
  treasure.y = (gameScene.height - treasure.height) / 2
  gameScene.addChild(treasure)

  // Blobs
  let numberOfBlobs = 6
  let spacing = 48
  let xOffset = 150
  let speed = 2
  let direction = 1

  blobs = []

  for (let i = 0; i < numberOfBlobs; i++) {
    let blob = new Sprite(atlas['blob.png'])
    let x = spacing * i + xOffset
    let y = randomInt(0, stage.height - blob.height)

    blob.x = x
    blob.y = y

    blob.vy = speed * direction
    direction *= -1

    blobs.push(blob)

    gameScene.addChild(blob)
  }

  healthBar = new Container()
  healthBar.position.set(stage.width - 170, 6)
  gameScene.addChild(healthBar)

  let innerBar = new Graphics()
  innerBar.beginFill(0x000000)
  innerBar.drawRect(0, 0, 128, 8)
  innerBar.endFill()
  healthBar.addChild(innerBar)

  let outerBar = new Graphics()
  outerBar.beginFill(0xFF3300)
  outerBar.drawRect(0, 0, 128, 8)
  outerBar.endFill()
  healthBar.addChild(outerBar)

  healthBar.outer = outerBar

  // GameOverScene
  gameOverSence = new Container()
  stage.addChild(gameOverSence)

  gameOverSence.visible = false

  message = new Text(
    'The end!',
    { font: '64px Futura', fill: 'white' }
  )
  message.x = 120
  message.y = stage.height / 2 - 32
  gameOverSence.addChild(message)


  let left = keyboard(37)
  let up = keyboard(38)
  let right = keyboard(39)
  let down = keyboard(40)

  left.press = function () {
    explorer.vx = -5
    explorer.vy = 0
  }

  left.release = function () {
    if (!right.isDown && explorer.vy === 0) {
      explorer.vx = 0
    }
  }

  up.press = function () {
    explorer.vy = -5
    explorer.vx = 0
  }

  up.release = function () {
    if (!down.isDown && explorer.vx === 0) {
      explorer.vy = 0
    }
  }

  right.press = function () {
    explorer.vx = 5
    explorer.vy = 0
  }

  right.release = function () {
    if (!left.isDown && explorer.vy === 0) {
      explorer.vx = 0
    }
  }

  down.press = function () {
    explorer.vy = 5
    explorer.vx = 0
  }
  down.release = function () {
    if (!up.isDown && explorer.vx === 0) {
      explorer.vy = 0
    }
  }

  state = play

  // Start the game loop
  gameLoop()
}


function gameLoop () {
  requestAnimationFrame(gameLoop)

  state()

  renderer.render(stage)
}


function play () {
  explorer.x += explorer.vx
  explorer.y += explorer.vy

  contain(explorer, {
    x: 28,
    y: 10,
    width: 488,
    height: 480
  })

  let explorerHit = false

  blobs.forEach(function (blob) {
    blob.y += blob.vy

    let blobHitsWall = contain(blob, {
      x: 28,
      y: 10,
      width: 488,
      height: 480
    })

    if (blobHitsWall === 'top' || blobHitsWall === 'bottom') {
      blob.vy *= -1
    }

    if (hitTestRectangle(explorer, blob)) {
      explorerHit = true
    }
  })

  if (explorerHit) {
    explorer.alpha = 0.5
    healthBar.outer.width -= 1
  } else {
    explorer.alpha = 1
  }

  if (hitTestRectangle(explorer, treasure)) {
    treasure.x = explorer.x + 8
    treasure.y = explorer.y + 8
  }

  if (healthBar.outer.width < 0) {
    state = end
    message.text = 'You lost!'
  }

  if (hitTestRectangle(treasure, door)) {
    state = end
    message.text = 'You won!'
  }
}


function end () {
  gameScene.visible = false
  gameOverSence.visible = true
}

function contain (sprite, container) {
  let collision = undefined

  if (sprite.x < container.x) {
    sprite.x = container.x
    collision = 'left'
  }

  if (sprite.y < container.y) {
    sprite.y = container.y
    collision = 'top'
  }

  if (sprite.x + sprite.width > container.width) {
    sprite.x = container.width - sprite.width
    collision = 'right'
  }

  if (sprite.y + sprite.height > container.height) {
    sprite.y = container.height - sprite.height
    collision = 'bottom'
  }

  return collision
}

function hitTestRectangle(rect1, rect2) {
  if (rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.height + rect1.y > rect2.y) {
    return true
  } else {
    return false
  }

}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function keyboard(keyCode) {
  var key = {}
  key.code = keyCode
  key.isDown = false
  key.isUp = true
  key.press = undefined
  key.release = undefined

  key.downHandler = function(event) {
    if (event.keyCode === key.code) {
      if (key.isUp && key.press) key.press()
      key.isDown = true
      key.isUp = false
    }
    // event.preventDefault()
  }

  key.upHandler = function(event) {
    if (event.keyCode === key.code) {
      if (key.isDown && key.release) key.release()
      key.isDown = false
      key.isUp = true
    }
    // event.preventDefault()
  }
  window.addEventListener(
    "keydown", key.downHandler.bind(key), false
  )
  window.addEventListener(
    "keyup", key.upHandler.bind(key), false
  )
  return key;
}
