BasicGame.Game = function(game) {

};

BasicGame.Game.prototype = {
  preload: function() {
    this.load.image('sea', 'assets/sea.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('enemyBullet', 'assets/enemy-bullet.png');
    this.load.image('powerup1', 'assets/powerup1.png');
    this.load.spritesheet('greenEnemy', 'assets/enemy.png', 32, 32);
    this.load.spritesheet('whiteEnemy', 'assets/shooting-enemy.png', 32, 32);
    this.load.spritesheet('explosion', 'assets/explosion.png', 32, 32);
    this.load.spritesheet('player', 'assets/player.png', 64, 64);
  },

  create: function() {
    this.setupBackground();
    this.setupPlayer();
    this.setupEnemies();
    this.setupBullets();
    this.setupExplosions();
    this.setupPlayerIcons();
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
    this.player.animations.add('ghost', [3, 0, 3, 1], 20, true);
    this.player.play('fly');
    this.physics.enable(this.player, Phaser.Physics.ARCADE)
    this.player.speed = BasicGame.PLAYER_SPEED;
    this.player.body.collideWorldBounds = true;
    this.player.body.setSize(20, 20, 0, -5);
    this.weaponLevel = 0;
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
    this.enemies.setAll('reward', BasicGame.ENEMY_REWARD, false, false, 0, true);
    this.enemies.setAll('dropRate', BasicGame.ENEMY_DROP_RATE, false, false, 0, true);

    this.enemies.forEach(function(enemy) {
      enemy.animations.add('fly', [0, 1, 2], 20, true);
      enemy.animations.add('hit', [3, 1, 3, 2], 20, false);
      enemy.events.onAnimationComplete.add(function(e) {
        e.play('fly');
      }, this);
    });

    this.nextEnemyAt = 0;
    this.enemyDelay = BasicGame.SPAWN_ENEMY_DELAY;

    this.shooters = this.add.group();
    this.shooters.enableBody = true;
    this.shooters.physicsBodyType = Phaser.Physics.ARCADE;
    this.shooters.createMultiple(20, 'whiteEnemy');
    this.shooters.setAll('anchor.x', 0.5);
    this.shooters.setAll('anchor.y', 0.5);
    this.shooters.setAll('outOfBoundsKill', true);
    this.shooters.setAll('checkWorldBounds', true);
    this.shooters.setAll('reward', BasicGame.SHOOTER_REWARD, false, false, 0, true);
    this.shooters.setAll('dropRate', BasicGame.SHOOTER_DROP_RATE, false, false, 0, true);

    this.shooters.forEach(function(shooter) {
      shooter.animations.add('fly', [0, 1, 2], 20, true);
      shooter.animations.add('hit', [3, 1, 3, 2], 20, false);
      shooter.events.onAnimationComplete.add(function(e) {
        e.play('fly');
      }, this);
    });

    this.nextShooterAt = this.time.now + Phaser.Timer.SECOND * 5;
    this.shooterDelay = BasicGame.SPAWN_SHOOTER_DELAY;
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

    this.enemyBullets = this.add.group();
    this.enemyBullets.enableBody = true;
    this.enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
    this.enemyBullets.createMultiple(100, 'enemyBullet');
    this.enemyBullets.setAll('anchor.x', 0.5);
    this.enemyBullets.setAll('anchor.y', 0.5);
    this.enemyBullets.setAll('outOfBoundsKill', true);
    this.enemyBullets.setAll('checkWorldBounds', true);
    this.enemyBullets.setAll('reward', 0, false, false, 0, true);
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

  setupPlayerIcons: function() {
    this.powerups = this.add.group();
    this.powerups.enableBody = true;
    this.powerups.physicsBodyType = Phaser.Physics.ARCADE;
    this.powerups.createMultiple(5, 'powerup1');
    this.powerups.setAll('anchor.x', 0.5);
    this.powerups.setAll('anchor.y', 0.5);
    this.powerups.setAll('outOfBoundsKill', true);
    this.powerups.setAll('checkWorldBounds', true);
    this.powerups.setAll(
      'reward', BasicGame.POWERUP_REWARD, false, false, 0, true
    );

    this.lives = this.add.group();
    var firstLifeIconX = this.game.width - 10 - (BasicGame.PLAYER_EXTRA_LIVES * 30);
    for (var i = 0; i < BasicGame.PLAYER_EXTRA_LIVES; i++) {
      var life = this.lives.create(firstLifeIconX + (30 * i), 30, 'player');
      life.scale.setTo(0.5, 0.5);
      life.anchor.setTo(0.5, 0.5);
    }
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

    this.score = 0;
    this.scoreText = this.add.text(
      this.game.width / 2, 30, '' + this.score, {
        font: '20px monospace',
        fill: '#fff',
        align: 'center'
      }
    );
    this.scoreText.anchor.setTo(0.5, 0.5);
  },

  update: function() {
    this.checkCollisions();
    this.spawnEnemies();
    this.enemyFire();
    this.processInput();
    this.processDelayedEffects();
  },

  checkCollisions: function() {
    this.physics.arcade.overlap(this.bullets, this.enemies, this.enemyHit, null, this);
    this.physics.arcade.overlap(this.bullets, this.shooters, this.enemyHit, null, this);
    this.physics.arcade.overlap(this.player, this.enemies, this.playerHit, null, this);
    this.physics.arcade.overlap(this.player, this.shooters, this.playerHit, null, this);
    this.physics.arcade.overlap(this.player, this.enemyBullets, this.playerHit, null, this);
    this.physics.arcade.overlap(this.player, this.powerups, this.playerPowerUp, null, this);
  },

  spawnEnemies: function() {
    if (this.nextEnemyAt < this.time.now && this.enemies.countDead() > 0) {
      this.nextEnemyAt = this.time.now + this.enemyDelay;
      var enemy = this.enemies.getFirstExists(false);
      // spawn at a random location top of the screen 
      enemy.reset(this.rnd.integerInRange(20, this.game.width - 20), 0, BasicGame.ENEMY_HEALTH);
      // also randomize the speed
      enemy.body.velocity.y = this.rnd.integerInRange(BasicGame.ENEMY_MIN_Y_VELOCITY, BasicGame.ENEMY_MAX_Y_VELOCITY);
      enemy.play('fly');
    }

    if (this.nextShooterAt < this.time.now && this.shooters.countDead() > 0) {
      this.nextShooterAt = this.time.now + this.shooterDelay;
      var shooter = this.shooters.getFirstExists(false);
      // spawn at a random location at the top
      shooter.reset(
        this.rnd.integerInRange(20, this.game.width - 20), 0,
        BasicGame.SHOOTER_HEALTH
      );
      // choose a random target location at the bottom
      var target = this.rnd.integerInRange(20, this.game.width - 20);
      // move to target and rotate the sprite accordingly
      shooter.rotation = this.physics.arcade.moveToXY(
        shooter, target, this.game.height,
        this.rnd.integerInRange(BasicGame.SHOOTER_MIN_VELOCITY, BasicGame.SHOOTER_MAX_VELOCITY)
      ) - Math.PI / 2;
      shooter.play('fly');
      // each shooter has their own shot timer
      shooter.nextShotAt = 0;
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
      if (this.returnText && this.returnText.exists) {
        this.quitGame();
      } else {
        this.fireBullet();
      }
    }
  },

  processDelayedEffects: function() {
    if (this.instructions.exists && this.time.now > this.instExpire) {
      this.instructions.destroy();
    }

    if (this.ghostUntil && this.ghostUntil < this.time.now) {
      this.ghostUntil = null;
      this.player.play('fly');
    }

    if (this.showReturn && this.time.now > this.showReturn) {
      this.returnText = this.add.text(
        this.game.width / 2, this.game.height / 2 + 20,
        'Press Spacebar or Tap Game to go back to Main Menu', {
          font: '16px sans-serif',
          fill: '#fff'
        }
      );
      this.returnText.anchor.setTo(0.5, 0.5);
      this.showReturn = false;
    }
  },

  render: function() {
    this.game.debug.body(this.player);
  },

  fireBullet: function() {
    // Limits bullet shooting
    if (!this.player.alive || this.nextShotAt > this.time.now) return;
    this.nextShotAt = this.time.now + this.shotDelay;

    var bullet;
    if (this.weaponLevel === 0) {
      if (this.bullets.countDead() === 0) return;

      bullet = this.bullets.getFirstExists(false);
      bullet.reset(this.player.x, this.player.y - 20);
      bullet.body.velocity.y = -BasicGame.BULLET_VELOCITY;
    } else {
      if (this.bullets.countDead() < this.weaponLevel * 2) return;

      for (var i = 0; i < this.weaponLevel; i++) {
        bullet = this.bullets.getFirstExists(false);
        bullet.reset(this.player.x - (10 + i * 6), this.player.y - 20);
        this.physics.arcade.velocityFromAngle(-95 - i * 10, BasicGame.BULLET_VELOCITY, bullet.body.velocity);

        bullet = this.bullets.getFirstExists(false);
        bullet.reset(this.player.x + (10 + i * 6), this.player.y - 20);
        this.physics.arcade.velocityFromAngle(-85 + i * 10, BasicGame.BULLET_VELOCITY, bullet.body.velocity);
      }
    }
  },

  enemyFire: function() {
    this.shooters.forEachAlive(function(enemy) {
      if (this.time.now > enemy.nextShotAt && this.enemyBullets.countDead() > 0) {
        var bullet = this.enemyBullets.getFirstExists(false);
        bullet.reset(enemy.x, enemy.y);
        this.physics.arcade.moveToObject(
          bullet, this.player, BasicGame.ENEMY_BULLET_VELOCITY);
        enemy.nextShotAt = this.time.now + BasicGame.SHOOTER_SHOT_DELAY;
      }
    }, this);
  },

  playerHit: function(player, enemy) {
    if (this.ghostUntil && this.ghostUntil > this.time.now) {
      return;
    }
    this.damageEnemy(enemy, BasicGame.CRASH_DAMAGE);

    var life = this.lives.getFirstAlive();

    if (life) {
      life.kill();
      this.weaponLevel = 0;
      this.ghostUntil = this.time.now + BasicGame.PLAYER_GHOST_TIME;
      this.player.play('ghost');
    } else {
      this.explode(player);
      player.kill();
      this.displayEnd(false);
    }
  },

  enemyHit: function(bullet, enemy) {
    bullet.kill();
    this.damageEnemy(enemy, BasicGame.BULLET_DAMAGE);
  },

  damageEnemy: function(enemy, damage) {
    enemy.damage(damage);
    if (enemy.alive) {
      enemy.play('hit');
    } else {
      this.explode(enemy);
      this.spawnPowerUp(enemy);
      this.addToScore(enemy.reward);
    }
  },

  spawnPowerUp: function(enemy) {
    if (this.powerups.countDead() === 0 || this.weaponLevel === 5) {
      return;
    }
    if (this.rnd.frac() < enemy.dropRate) {
      var powerUp = this.powerups.getFirstExists(false);
      powerUp.reset(enemy.x, enemy.y);
      powerUp.body.velocity.y = BasicGame.POWERUP_VELOCITY;
    }
  },

  playerPowerUp: function(player, powerUp) {
    this.addToScore(powerUp.reward);
    powerUp.kill();
    if (this.weaponLevel < 5) {
      this.weaponLevel += 1;
    }
  },

  addToScore: function(score) {
    this.score += score;
    this.scoreText.text = this.score;

    if (this.score >= 20000) {
      this.enemies.destroy();
      this.shooters.destroy();
      this.enemyBullets.destroy();
      this.displayEnd(true);
    }
  },

  explode: function(sprite) {
    if (this.explosions.countDead() === 0) return;

    var explosion = this.explosions.getFirstExists(false);
    explosion.reset(sprite.x, sprite.y);
    explosion.play('explode', 15, false, true);

    explosion.body.velocity.x = sprite.body.velocity.x;
    explosion.body.velocity.y = sprite.body.velocity.y;
  },

  displayEnd: function(win) {
    if (this.endText && this.endText.exists) {
      return;
    }
    var msg = win ? 'You Win!!!' : 'Game Over!';
    this.endText = this.add.text(
      this.game.width / 2, this.game.height / 2 - 60, msg, {
        font: '72px serif',
        fill: '#fff'
      }
    );
    this.endText.anchor.setTo(0.5, 0);
    this.showReturn = this.time.now + BasicGame.RETURN_MESSAGE_DELAY;
  },

  quitGame: function(pointer) {
    this.sea.destroy();
    this.player.destroy();
    this.enemies.destroy();
    this.bullets.destroy();
    this.explosions.destroy();
    this.instructions.destroy();
    this.scoreText.destroy();
    this.endText.destroy();
    this.returnText.destroy();

    this.state.start('MainMenu');
  }

};
