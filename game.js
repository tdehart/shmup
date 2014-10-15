BasicGame.Game = function(game) {

};

BasicGame.Game.prototype = {
  preload: function() {
    this.load.image('sea', 'assets/sea.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.spritesheet('greenEnemy', 'assets/enemy.png', 32, 32);
    this.load.spritesheet('explosion', 'assets/explosion.png', 32, 32);
    this.load.spritesheet('player', 'assets/player.png', 64, 64);
  },

  create: function() {
    this.setupBackground();
    this.setupPlayer();
    this.setupEnemies();
    this.setupBullets();
    this.setupExplosions();
    this.setupText();

    this.cursors = this.input.keyboard.createCursorKeys();
  },

  setupBackground: function() {
    this.sea = this.add.tileSprite(0, 0, this.game.width, this.game.height, 'sea');
    this.sea.autoScroll(0, BasicGame.SEA_SCROLL_SPEED);
  },

  setupPlayer: function() {
    this.player = this.add.sprite(this.game.width / 2, this.game.height - 50, 'player');
    this.player.anchor.setTo(0.5, 0.5);
    this.player.animations.add('fly', [0, 1, 2], 20, true);
    this.player.play('fly');
    this.physics.enable(this.player, Phaser.Physics.ARCADE)
    this.player.speed = BasicGame.PLAYER_SPEED;
    this.player.body.collideWorldBounds = true;
    this.player.body.setSize(20, 20, 0, -5);
  },

  setupEnemies: function() {
    this.enemies = this.add.group();
    this.enemies.enableBody = true;
    this.enemies.physicsBodyType = Phaser.Physics.ARCADE;
    this.enemies.createMultiple(50, 'greenEnemy');
    this.enemies.setAll('anchor.x', 0.5);
    this.enemies.setAll('anchor.y', 0.5);
    this.enemies.setAll('outOfBoundsKill', true);
    this.enemies.setAll('checkWorldBounds', true);
    this.enemies.forEach(function(enemy) {
      enemy.animations.add('fly', [0, 1, 2], 20, true);
    });

    this.nextEnemyAt = 0;
    this.enemyDelay = BasicGame.SPAWN_ENEMY_DELAY;
  },

  setupBullets: function() {
    this.bullets = this.add.group();
    this.bullets.enableBody = true;
    this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
    this.bullets.createMultiple(100, 'bullet');
    this.bullets.setAll('anchor.x', 0.5);
    this.bullets.setAll('anchor.y', 0.5);
    this.bullets.setAll('outOfBoundsKill', true);
    this.bullets.setAll('checkWorldBounds', true);

    this.nextShotAt = 0;
    this.shotDelay = BasicGame.SHOT_DELAY;
  },

  setupExplosions: function() {
    this.explosions = this.add.group();
    this.explosions.enableBody = true;
    this.explosions.physicsBodyType = Phaser.Physics.ARCADE;
    this.explosions.createMultiple(100, 'explosion');
    this.explosions.setAll('anchor.x', 0.5);
    this.explosions.setAll('anchor.y', 0.5);
    this.explosions.forEach(function(explosion) {
      explosion.animations.add('explode');
    });
  },

  setupText: function() {
    this.instructions = this.add.text(this.game.width / 2, this.game.height - 100,
      'Use Arrow Keys to Move, Press Space to Fire\n' + 'Tapping/clicking does both', {
        font: '20px monospace',
        fill: '#fff',
        align: 'center'
      }
    );
    this.instructions.anchor.setTo(0.5, 0.5);
    this.instExpire = this.time.now + BasicGame.INSTRUCTION_EXPIRE;
  },

  update: function() {
    this.checkCollisions();
    this.spawnEnemies();
    this.processInput();
    this.processDelayedEffects();
  },

  checkCollisions: function() {
    this.physics.arcade.overlap(this.bullets, this.enemies, this.enemyHit, null, this);
    this.physics.arcade.overlap(this.player, this.enemies, this.playerHit, null, this);
  },

  spawnEnemies: function() {
    if (this.nextEnemyAt < this.time.now && this.enemies.countDead() > 0) {
      this.nextEnemyAt = this.time.now + this.enemyDelay;
      var enemy = this.enemies.getFirstExists(false);
      // spawn at a random location top of the screen 
      enemy.reset(this.rnd.integerInRange(20, this.game.width - 20), 0);
      // also randomize the speed
      enemy.body.velocity.y = this.rnd.integerInRange(BasicGame.ENEMY_MIN_Y_VELOCITY, BasicGame.ENEMY_MAX_Y_VELOCITY);
      enemy.play('fly');
    }
  },

  processInput: function() {
    // Keep player still when no keys are pressed
    this.player.body.velocity.x = 0;
    this.player.body.velocity.y = 0;

    if (this.cursors.left.isDown) {
      this.player.body.velocity.x = -this.player.speed;
    } else if (this.cursors.right.isDown) {
      this.player.body.velocity.x = this.player.speed;
    }

    if (this.cursors.up.isDown) {
      this.player.body.velocity.y = -this.player.speed;
    } else if (this.cursors.down.isDown) {
      this.player.body.velocity.y = this.player.speed;
    }

    if (this.input.activePointer.isDown && this.physics.arcade.distanceToPointer(this.player) > 15) {
      this.physics.arcade.moveToPointer(this.player, this.player.speed);
    }

    if (this.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) || this.input.activePointer.isDown) {
      this.fireBullet();
    }
  },

  processDelayedEffects: function() {
    if (this.instructions.exists && this.time.now > this.instExpire) {
      this.instructions.destroy();
    }
  },

  render: function() {
    this.game.debug.body(this.player);
  },

  fireBullet: function() {
    // No bullets left
    if (this.bullets.countDead() === 0) return;

    // Limits bullet shooting
    if (!this.player.alive || this.nextShotAt > this.time.now) return;
    this.nextShotAt = this.time.now + this.shotDelay;

    var bullet = this.bullets.getFirstExists(false);
    bullet.reset(this.player.x, this.player.y - 20);
    bullet.body.velocity.y = -BasicGame.BULLET_VELOCITY;

  },

  playerHit: function(player, enemy) {
    enemy.kill();
    player.kill();
    this.explode(player);
    this.explode(enemy);
  },

  enemyHit: function(bullet, enemy) {
    enemy.kill();
    bullet.kill();
    this.explode(enemy);
  },

  explode: function(sprite) {
    if (this.explosions.countDead() === 0) return;

    var explosion = this.explosions.getFirstExists(false);
    explosion.reset(sprite.x, sprite.y);
    explosion.play('explode', 15, false, true);

    explosion.body.velocity.x = sprite.body.velocity.x;
    explosion.body.velocity.y = sprite.body.velocity.y;
  },

  quitGame: function(pointer) {
    this.state.start('MainMenu');
  }

};
