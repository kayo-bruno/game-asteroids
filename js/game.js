var gameProperties = {
    screenWidth: 640,
    screenHeight: 480,
    delayToStartLevel: 2,
    padding: 30,
};

var states = {
	game: "game",
	main: 'main',
	gameOver: 'gameOver'
};

var graphicAssets = {
    // ship: {URL:'assets/ship.png', name:'ship'},
	ship: {URL:'assets/ship-anim.png', name:'ship'},
	bullet: {URL:'assets/bullet.png', name:'bullet'},

	asteroidExtra: {URL:'assets/asteroid-21.png', name:'asteroidExtra'},
	asteroidLarge: {URL:'assets/asteroid-13.png', name:'asteroidLarge'},
	asteroidMedium: {URL:'assets/asteroid-8.png', name:'asteroidMedium'},
	asteroidSmall: {URL:'assets/asteroid-5.png', name:'asteroidSmall'}
};

var soundAssets = {
    fire:{URL:['assets/fire.m4a', 'assets/fire.ogg'], name:'fire'},
    destroyed:{URL:['assets/destroyed.m4a', 'assets/destroyed.ogg'], name:'destroyed'},
};

var shipProperties = {
	startX: gameProperties.screenWidth * 0.5, 	// Posição X inicial da nave
	startY: gameProperties.screenHeight * 0.5, 	// Posição Y inicial da nave
	acceleration: 300,
	drag: 100,
	maxVelocity: 300,
	angularVelocity: 200,
	startingLives: 3, 	// Quantidade de vidas
	timeToReset: 1, // Tempo que vai ficar sem colidir após nascer
	blinkDelay: 0.2,
};

var bulletProperties = {
	speed: 400, 	 // Velocidade da Bala
	interval: 150,	 // Taxa de Disparo
	lifeSpan: 2000,  // Tempo de vida da Bala
	maxCount: 30,    // Número máximo de marcardor de altura
};

var asteroidProperties = {
    startingAsteroids: 4, 	// Número de asteroids iniciais do jogo
    maxAsteroids: 20,		// Número máximo de asteroids
    incrementAsteroids: 2,	// A cada rodada aumenta o número de asteroids

    /**
     * minVelocity: velocidade minima do asteroid
     * maxVelocity: velocidade máxima do asteroid
     * minAngularVelocity: velocidade mínima de rotação do asteróide
     * maxAngularVelocity: velocidade de rotação máxima do asteróide
     * score: pontos ao destruir o asteroid
     * nextSize: Tamanho do novo asteroid que irá aparecer ao destruir o atual
     **/
    asteroidExtra: { minVelocity: 50, maxVelocity: 100, minAngularVelocity: 0, maxAngularVelocity: 200, score: 10, nextSize: graphicAssets.asteroidLarge.name, nextSizeTwo: graphicAssets.asteroidMedium.name, pieces: 1 },
    asteroidLarge: { minVelocity: 50, maxVelocity: 150, minAngularVelocity: 0, maxAngularVelocity: 200, score: 20, nextSize: graphicAssets.asteroidMedium.name, nextSizeTwo: graphicAssets.asteroidSmall.name, pieces: 1 },
    asteroidMedium: { minVelocity: 50, maxVelocity: 200, minAngularVelocity: 0, maxAngularVelocity: 200, score: 50, nextSize: graphicAssets.asteroidSmall.name, pieces: 1 },
    asteroidSmall: { minVelocity: 50, maxVelocity: 300, minAngularVelocity: 0, maxAngularVelocity: 200, score: 100 },
};

var fontAssets = {
	counterFontStyle: {font: '20px Arial', fill: '#FFFFFF', align: 'center'}
};

var gameState = function(game){
	this.shipSprite;
	this.shipIsInvulnerable;

	this.key_left;
	this.key_right;
	this.key_thrust;
	this.key_fire;

	this.bulletGroup;
	this.asteroidGroup;
	this.tf_lives;	      // Irá apresentar o nosso contador de vidas
    this.tf_score;		  // Irá apresentar os pontos na tela

    this.sndDestroyed;	  // Som de destruição
    this.sndFire;		  // Som do tiro
};

gameState.prototype = {

	// Carrega os ativos do jogo
	preload: function(){
		// Imagens dos asteroids
		game.load.image(graphicAssets.asteroidExtra.name, graphicAssets.asteroidExtra.URL);
		game.load.image(graphicAssets.asteroidLarge.name, graphicAssets.asteroidLarge.URL);
		game.load.image(graphicAssets.asteroidMedium.name, graphicAssets.asteroidMedium.URL);
		game.load.image(graphicAssets.asteroidSmall.name, graphicAssets.asteroidSmall.URL);

		// Imagens da NAVE e das balas
		game.load.image(graphicAssets.bullet.name, graphicAssets.bullet.URL);
        // game.load.image(graphicAssets.ship.name, graphicAssets.ship.URL);
		game.load.spritesheet(graphicAssets.ship.name, graphicAssets.ship.URL, 21, 13, 2);

		// Carrega as arquivos de audio
		game.load.audio(soundAssets.destroyed.name, soundAssets.destroyed.URL);
        game.load.audio(soundAssets.fire.name, soundAssets.fire.URL);
	},

	init: function () {
		this.bulletInterval = 0;
		this.asteroidsCount = asteroidProperties.startingAsteroids;
		this.shipLives = shipProperties.startingLives;	// Controla a quantidade de vidas
		this.score = 0;		// Pontos

	},

	create: function() {
		this.initGraphics();
		this.initSounds();
		this.initPhysics();
		this.initKeyboard();
		this.resetAsteroids();
		game.stage.backgroundColor = "#4488AA";
	},

	update: function() {
		this.checkPlayerInput();
		this.checkBoundaries(this.shipSprite);
		this.bulletGroup.forEachExists(this.checkBoundaries, this); // Faz a bala sair do outro lado
		this.asteroidGroup.forEachExists(this.checkBoundaries, this);

		game.physics.arcade.overlap(this.bulletGroup, this.asteroidGroup, this.asteroidCollision, null, this);
        game.physics.arcade.overlap(this.shipSprite, this.asteroidGroup, this.asteroidCollision, null, this);

        if (!this.shipIsInvulnerable) {
            game.physics.arcade.overlap(this.shipSprite, this.asteroidGroup, this.asteroidCollision, null, this);
        }

	},

	// Adiciona todos os sprites do jogo
	initGraphics: function() {
		this.shipSprite = game.add.sprite(shipProperties.startX, shipProperties.startY, graphicAssets.ship.name);
        this.shipSprite.angle = -90;
        this.shipSprite.anchor.set(0.5, 0.5);

        this.bulletGroup = game.add.group();	 // Cria um grupo de balas
        this.asteroidGroup = game.add.group();	 // Cria um grupo de asteroids

        this.tf_lives = game.add.text(20, 10, shipProperties.startingLives, fontAssets.counterFontStyle);

        this.tf_score = game.add.text(gameProperties.screenWidth - 20, 10, "0", fontAssets.counterFontStyle);
        this.tf_score.align = 'right';
        this.tf_score.anchor.set(1, 0);
	},


    // Inicia as animacoes da nave
    initAnimationShip: function () {
        var acceleration = this.shipSprite.animations.add('acce');
        this.shipSprite.animations.play('acce', 10, false);
    },

    // Dar stop na animacao da nave
    stopAnimationShip: function () {
        this.shipSprite.animations.stop(null, true);
    },

	// Função para inicializar os sons
    initSounds: function () {
        this.sndDestroyed = game.add.audio(soundAssets.destroyed.name);
        this.sndFire = game.add.audio(soundAssets.fire.name);
    },


	// Inicia a Physica do jogo
	initPhysics: function(){
		game.physics.startSystem(Phaser.Physics.ARCADE);

		game.physics.enable(this.shipSprite, Phaser.Physics.ARCADE);
		this.shipSprite.body.drag.set(shipProperties.drag);
		this.shipSprite.body.maxVelocity.set(shipProperties.maxVelocity);

		this.bulletGroup.enableBody = true;		// Habilita a fisica no corpo
		this.bulletGroup.physicsBodyType = Phaser.Physics.ARCADE;	// Tipo de física Padrão
		this.bulletGroup.createMultiple(bulletProperties.maxCount, graphicAssets.bullet.name); 	// Cria vários sprites
		this.bulletGroup.setAll('anchor.x', 0.5);
		this.bulletGroup.setAll('anchor.y', 0.5);
		this.bulletGroup.setAll('lifespan', bulletProperties.lifeSpan);

		this.asteroidGroup.enableBody = true;
		this.asteroidGroup.physicsBodyType = Phaser.Physics.ARCADE;
	},

	// Inicializa os botoes utilizados para controlar a nave
	initKeyboard: function() {
		this.key_left   = game.input.keyboard.addKey(Phaser.Keyboard.LEFT); 	// Botão da esquerda
		this.key_right  = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT); 	// Botão da direita
		this.key_thrust = game.input.keyboard.addKey(Phaser.Keyboard.UP);		// Botão para frente
		this.key_fire   = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)  // Botão para atirar
	},

	// Verifica os botoes precionados e movimenta a nave de acordo com cada botao
	checkPlayerInput: function() {

		if (this.key_left.isDown) {
			this.shipSprite.body.angularVelocity = -shipProperties.angularVelocity;
		}
		else if (this.key_right.isDown) {
			this.shipSprite.body.angularVelocity = shipProperties.angularVelocity;
		} else {
			this.shipSprite.body.angularVelocity = 0;
		}

		if (this.key_thrust.isDown) {
			game.physics.arcade.accelerationFromRotation(this.shipSprite.rotation, shipProperties.acceleration, this.shipSprite.body.acceleration);
		}
		else {
            this.initAnimationShip();
			this.shipSprite.body.acceleration.set(0);
		}

		if (this.key_fire.isDown) {
			this.fire();
		}
	},

	// Verifica se o sprite ultrapassou os limites da tela do jogo
    checkBoundaries: function (sprite) {
        if (sprite.x + gameProperties.padding < 0) {
            sprite.x = game.width + gameProperties.padding;
        } else if (sprite.x - gameProperties.padding> game.width) {
            sprite.x = -gameProperties.padding;
        }

        if (sprite.y + gameProperties.padding < 0) {
            sprite.y = game.height + gameProperties.padding;
        } else if (sprite.y - gameProperties.padding> game.height) {
            sprite.y = -gameProperties.padding;
        }
    },

	// Função para atirar
	fire: function () {
		if (game.time.now > this.bulletInterval) {

			if (!this.shipSprite.alive) {
	            return;
	        }

			this.sndFire.play();

			var bullet = this.bulletGroup.getFirstExists(false);

			if (bullet) {
				var length = this.shipSprite.width * 0.5;
				var x = this.shipSprite.x + (Math.cos(this.shipSprite.rotation) * length);
				var y = this.shipSprite.y + (Math.sin(this.shipSprite.rotation) * length);

				bullet.reset(x, y);
				bullet.lifespan = bulletProperties.lifeSpan;
				bullet.rotation = this.shipSprite.rotation;

				game.physics.arcade.velocityFromRotation(this.shipSprite.rotation, bulletProperties.speed, bullet.body.velocity);
				this.bulletInterval = game.time.now + bulletProperties.interval;
			}
		}
	},

	/*
	 * Função para criar asteroids
 	 * x: posição X do asteroid
 	 * y: posição Y do asteroid
 	 * size: tamanho do asteroid
	 */
	createAsteroid: function (x, y, size, pieces) {
        if (pieces === undefined) { pieces = 1; }

        for (var i=0; i<pieces; i++) {
            var asteroid = this.asteroidGroup.create(x, y, size);
            asteroid.anchor.set(0.5, 0.5);
            asteroid.body.angularVelocity = game.rnd.integerInRange(asteroidProperties[size].minAngularVelocity, asteroidProperties[size].maxAngularVelocity);

            var randomAngle = game.math.degToRad(game.rnd.angle());
            var randomVelocity = game.rnd.integerInRange(asteroidProperties[size].minVelocity, asteroidProperties[size].maxVelocity);

            game.physics.arcade.velocityFromRotation(randomAngle, randomVelocity, asteroid.body.velocity);
        }
    },

    // Função para resetar os asteroids
    resetAsteroids: function () {
        for (var i=0; i < this.asteroidsCount; i++ ) {
            var side = Math.round(Math.random());
            var x;
            var y;

            if (side) {
                x = Math.round(Math.random()) * gameProperties.screenWidth;
                y = Math.random() * gameProperties.screenHeight;
            } else {
                x = Math.random() * gameProperties.screenWidth;
                y = Math.round(Math.random()) * gameProperties.screenHeight;
            }

            this.createAsteroid(x, y, graphicAssets.asteroidExtra.name);
        }
    },

    // Detectar colisão
    asteroidCollision: function (target, asteroid) {

		this.sndDestroyed.play();
		this.changeColor();

    	target.kill();

    	if (target.key == graphicAssets.ship.name) {
    		this.destroyShip();
    	}

    	if (target.key == graphicAssets.bullet.name) {
    		this.splitAsteroid(asteroid);
    		this.updateScore(asteroidProperties[asteroid.key].score);
    		asteroid.kill();
    	}


    	 if (!this.asteroidGroup.countLiving()) {
            game.time.events.add(Phaser.Timer.SECOND * gameProperties.delayToStartLevel, this.nextLevel, this);
        }
    },

    // Destroi a nave e atualiza as vidas
    destroyShip: function () {
    	this.shipLives --;		// Diminui uma vida
    	this.tf_lives.text = this.shipLives;	// Atualiza o total de vidas

    	// Verifica se ainda tem vidas, caso tenha a nave nasce novamente
    	if (this.shipLives) {
            game.time.events.add(Phaser.Timer.SECOND * shipProperties.timeToReset, this.resetShip, this);
        } else {
            game.time.events.add(Phaser.Timer.SECOND * shipProperties.timeToReset, this.endGame, this);
        }
    },

    // Reviver a nave
    resetShip: function () {
    	this.shipIsInvulnerable = true;
    	this.shipSprite.reset(shipProperties.startX, shipProperties.startY);
    	this.shipSprite.angle = -90;

    	game.time.events.add(Phaser.Timer.SECOND * shipProperties.timeToReset, this.shipReady, this);
    	game.time.events.repeat(Phaser.Timer.SECOND * shipProperties.blinkDelay, shipProperties.timeToReset / shipProperties.blinkDelay, this.shipBlink, this);
    },

    // Deixa a nave vulneravel novamente
    shipReady: function () {
        this.shipIsInvulnerable = false;
        this.shipSprite.visible = true;
    },


    shipBlink: function () {
        this.shipSprite.visible = !this.shipSprite.visible;
    },

    // Divide os asteroids
    splitAsteroid: function (asteroid) {
        if (asteroidProperties[asteroid.key].nextSize) {
            this.createAsteroid(asteroid.x, asteroid.y, asteroidProperties[asteroid.key].nextSize, asteroidProperties[asteroid.key].pieces);
            if (asteroidProperties[asteroid.key].nextSizeTwo) {
            	this.createAsteroid(asteroid.x, asteroid.y, asteroidProperties[asteroid.key].nextSizeTwo, asteroidProperties[asteroid.key].pieces);
            }
        }
    },

    // Atualiza os Pontos
    updateScore: function (score) {
    	this.score += score;
        this.tf_score.text = this.score;
    },

    // Próximo nível
    nextLevel: function () {
        this.asteroidGroup.removeAll(true);

        if (this.asteroidsCount < asteroidProperties.maxAsteroids) {
            this.asteroidsCount += asteroidProperties.incrementAsteroids;
        }

        this.resetAsteroids();
    },

    // Termina o jogo
    endGame: function () {
        game.state.start(states.gameOver);
    },

    // Altera a cor do background
    changeColor: function () {
	    var c = Phaser.Color.getRandomColor(180, 255, 255);
	    game.stage.backgroundColor = c;
	},

};

var mainState = function (game) {
    this.tf_start;
};

mainState.prototype = {
    create: function () {
    	var startInstructions = 'Click para jogar\n\nUtilize as setas do teclado \n\npara se movimentar.\n\ne a tecla espaço para atira.';

        this.tf_start = game.add.text(game.world.centerX, game.world.centerY, startInstructions, fontAssets.counterFontStyle);
        this.tf_start.align = 'center';
        this.tf_start.anchor.set(0.5, 0.5);

        game.input.onDown.addOnce(this.startGame, this);
    },

    startGame: function () {
        game.state.start(states.game);
    },
};

var gameOverState = function (game) {
	this.tf_over;
    this.score = 2;
};

gameOverState.prototype = {
	create: function () {
		var startInstructions = 'GAME OVER ';
        this.tf_over = game.add.text(game.world.centerX, game.world.centerY, startInstructions, fontAssets.counterFontStyle);
        this.tf_over.align = 'center';
        this.tf_over.anchor.set(0.5, 0.5);

        game.input.onDown.addOnce(this.startGame, this);
	},

	startGame: function () {
		game.state.start(states.game);
	}
};

var game = new Phaser.Game(gameProperties.screenWidth, gameProperties.screenHeight, Phaser.AUTO, 'gameDiv');
game.state.add(states.main, mainState);
game.state.add(states.game, gameState);
game.state.add(states.gameOver, gameOverState);
game.state.start(states.main);