
var game = new Phaser.Game(320, 480, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update });

function preload() {

    game.load.atlas('breakout', 'assets/games/breakout/breakout.png', 'assets/games/breakout/breakout.json');
    game.load.image('background', 'assets/misc/backgroundHudGlow.png');
    game.load.image('hud', 'assets/misc/hud.png');
    game.load.image('block', 'assets/blockgreen.png');
    game.load.image('arrow', 'assets/arrow.png');
    game.load.image('deadly', 'assets/blockdeadghost.png');
    game.load.image('coin', 'assets/coin.png');
    game.load.image('hero', 'assets/misc/hero.png');

}

var ball;
var bricks;
//var knocker;
var arrow;
var levelGraphics;
var hud;

var hudHeight = 50;
var gamePlayWidth = 320;
var gamePlayHeigth = 480 - hudHeight;
var blockW = 16;

var levelDrawing = [
    // Wall1
    [0*blockW, 10*blockW],
    [4*blockW, 10*blockW],
    [5*blockW, 10*blockW],
    [6*blockW, 10*blockW],
    [7*blockW, 10*blockW],
    [7*blockW, 11*blockW],
    [7*blockW, 12*blockW],
    [7*blockW, 13*blockW],
    [7*blockW, 14*blockW],
    [7*blockW, 15*blockW],
    [7*blockW, 16*blockW],
    [7*blockW, 17*blockW],
    [7*blockW, 18*blockW],
    [7*blockW, 19*blockW],
    [8*blockW, 19*blockW],
    [9*blockW, 19*blockW],
    [10*blockW, 19*blockW],
    [10*blockW, 20*blockW],
    [10*blockW, 21*blockW],
    [10*blockW, 22*blockW],
    [10*blockW, 23*blockW],
    // Wall2
    [13*blockW, 4*blockW],
    [14*blockW, 4*blockW],
    [15*blockW, 4*blockW],
    [16*blockW, 4*blockW],
    [17*blockW, 4*blockW],
    [18*blockW, 4*blockW],
    [19*blockW, 4*blockW],
    [13*blockW, 5*blockW],
    [13*blockW, 9*blockW],
    [13*blockW, 10*blockW],
    [14*blockW, 10*blockW],
    [15*blockW, 10*blockW],
    [16*blockW, 10*blockW],
    [17*blockW, 10*blockW],
    [18*blockW, 10*blockW],
    [19*blockW, 10*blockW]
];

var deadlyGroup = []; // an array which will be filled with enemies
var deadlyArrayKeepTrack = [];

var wallArrayKeepTrack = [];

var coinArrayKeepTrack = [];

var lives = 3;
var score = 0;
var rotateSpeed = 3; // arrow rotation speed
var rotateDirection = 1; // rotate direction: 1-clockwise, 2-counterclockwise
var degToRad=0.0174532925; // degrees-radians conversion
var power = 0; // power to fire the ball
var minPower = 50; // minimum power applied to ball
var maxPower = 400; // maximum power applied to ball
var charging=false; // are we charging the power?

var scoreText;
var livesText;
var introText;

var s;

function create() {

    game.physics.startSystem(Phaser.Physics.ARCADE);

    s = game.add.tileSprite(0, 0, 320, 480, 'background');
    
    levelGraphics = game.add.group();
    levelGraphics.enableBody = true;
    levelGraphics.physicsBodyType = Phaser.Physics.ARCADE;

    for(i = 0; i < levelDrawing.length; i++) {
        createLevelGraphics(levelDrawing[i][0],levelDrawing[i][1]);
    }

    bricks = game.add.group();
    bricks.enableBody = true;
    bricks.physicsBodyType = Phaser.Physics.ARCADE;

    var coin;

    for (var y = 0; y < 1; y++)
    {
        for (var x = 0; x < 8; x++)
        {
            //brick = bricks.create(Math.random()*game.width,Math.random()*game.height, 'breakout', 'brick_' + (y+1) + '_1.png');
            do {
                //var rndX = Math.random()*gamePlayWidth + 16;
                //var rndY = Math.random()*gamePlayHeigth - 32;
                var rndX = this.rnd.integerInRange(32, gamePlayWidth-32);
                var rndY = this.rnd.integerInRange(32, gamePlayHeigth-32);
                coin = bricks.create(rndX, rndY, 'coin');
                var isoverlapping = isOverlapping(coin, wallArrayKeepTrack);
                var isoverlapping3 = isOverlapping(coin, coinArrayKeepTrack);
                if(isoverlapping || isoverlapping3)
                    coin.kill();
            } while (isoverlapping || isoverlapping3);
            
            coinArrayKeepTrack.push(coin);
            
            coin.body.bounce.set(1);
            coin.body.immovable = true;
        }
    }

    ball = game.add.sprite(game.world.centerX,game.world.centerY, 'hero');
    ball.anchor.set(0.5);
    ball.checkWorldBounds = true;

    game.physics.enable(ball, Phaser.Physics.ARCADE);

    ball.body.collideWorldBounds = true;
    ball.body.bounce.set(1);

    //ball.animations.add('spin', [ 'ball_1.png', 'ball_2.png', 'ball_3.png', 'ball_4.png', 'ball_5.png' ], 50, true, false);
    
    //ball.scale.setTo(2, 2);
    
    deadlyGroup = game.add.group();
    deadlyGroup.enableBody = true;
    deadlyGroup.physicsBodyType = Phaser.Physics.ARCADE;
    //var deadly;
    
    for(ii = 0; ii < 4; ii++) {
        spawnNewDeadly();
    }
    
    // the rotating arrow, look at its x registration point
    arrow = game.add.sprite(game.world.centerX,game.world.centerY,"arrow");
    arrow.anchor.x = -1;
    arrow.anchor.y = 0.5;
    
    hud = game.add.sprite(game.world.centerX,480, 'hud');
    hud.anchor.set(0.5);
    hud.checkWorldBounds = true;

    game.physics.enable(hud, Phaser.Physics.ARCADE);

    hud.body.collideWorldBounds = true;
    hud.body.bounce.set(1);
    hud.body.immovable = true;
    
    scoreText = game.add.text(5, 435, 'score: 0 - power: 0', { font: "16px Arial", fill: "#ffffff", align: "left" });
    livesText = game.add.text(5, 455, 'lives: 3', { font: "16px Arial", fill: "#ffffff", align: "left" });

    game.input.onDown.add(releaseBall, this);

}

function update () {
    game.physics.arcade.collide(ball, hud, ballHitHud, null, this);
    game.physics.arcade.collide(ball, levelGraphics, ballHitKnocker, null, this);
    game.physics.arcade.collide(ball, bricks, ballHitBrick, null, this);
    game.physics.arcade.collide(ball, deadlyGroup, ballHitDeadly, null, this);
    
    if(charging) {
        power = power + 10;
        power = Math.min(power, maxPower);
        // then game text is updated
        scoreText.text = 'score: ' + score + ' - power: ' + power;
    } else {
        arrow.angle+=rotateSpeed*rotateDirection;
    }
    
    // update arrow position
    arrow.x=ball.x;
    arrow.y=ball.y;

    deaccelareta();
}

function releaseBall () {

        //ball.body.velocity.y = -300;
        //ball.body.velocity.x = -75;
        power = minPower;
        game.input.onDown.remove(releaseBall, this);
        game.input.onUp.add(fire, this);  
        charging=true;
}

function fire() {
    game.input.onUp.remove(fire, this); 
    game.input.onDown.add(releaseBall, this);
    
    ball.body.velocity.y += Math.sin(arrow.angle*degToRad)*power/2;
    ball.body.velocity.x += Math.cos(arrow.angle*degToRad)*power/2;
    ball.animations.play('spin');
    
    power = 0;
    charging=false; 

    rotateDirection*=-1;
}

function deaccelareta() {
        ball.body.velocity.y*=0.99;
        ball.body.velocity.x*=0.99;
}

function gameOver () {

    ball.body.velocity.setTo(0, 0);

}

function ballHitBrick (_ball, _brick) {

    _brick.kill();

    score += 10;

    scoreText.text = 'score: ' + score + ' - power: ' + power;

    //  Are they any bricks left?
    if (bricks.countLiving() == 0)
    {
        //  New level starts
        score += 1000;
        scoreText.text = 'score: ' + score + ' - power: ' + power;

        //  Let's move the ball back to the paddle
        ball.body.velocity.set(0);
        ball.x = 100 + 16;
        ball.y = 100 - 16;
        ball.animations.stop();

        //  And bring the bricks back from the dead :)
        bricks.callAll('revive');
    }

}

function ballHitKnocker (_ball, _knocker) {

}

function ballHitHud(_ball, _hud) {
    
}

function ballHitDeadly(_ball, _deadly) {
    _deadly.kill();
    lives = lives - 1;
    livesText.text = 'lives: ' + lives;
    spawnNewDeadly();
}

function spawnNewDeadly() {
    var deadly;
    do {
        //var rndX = Math.random()*gamePlayWidth + 16;
        //var rndY = Math.random()*gamePlayHeigth - 32;
        var rndX = game.rnd.integerInRange(32, gamePlayWidth-33);
        var rndY = game.rnd.integerInRange(32, gamePlayHeigth-33);
        deadly = deadlyGroup.create(rndX, rndY, 'deadly');
        var isoverlapping = isOverlapping(deadly, wallArrayKeepTrack);
        var isoverlapping2 = isOverlapping(deadly, deadlyArrayKeepTrack);
        var isoverlapping3 = isOverlapping(deadly, coinArrayKeepTrack);
        
        if(isoverlapping || isoverlapping2 || isoverlapping3)
            deadly.kill();
    } while (isoverlapping || isoverlapping2 || isoverlapping3);
        
    deadlyArrayKeepTrack.push(deadly);

    deadly.body.bounce.set(0);
    deadly.body.immovable = true;
}

function createLevelGraphics(_x, _y) {
    var knocker;
    knocker = levelGraphics.create(_x,_y, 'block');
    
    wallArrayKeepTrack.push(knocker);
    
    knocker.body.bounce.set(1);
    knocker.body.immovable = true;
    knocker.scale.setTo(0.5, 0.5);
}

function isOverlapping(_sprite, _list) {
    var isAnyOverlapping = false;
    
    for(i = 0; i < _list.length; i++) {
        if(!isAnyOverlapping) {
            isAnyOverlapping = game.physics.arcade.overlap(_sprite, _list[i]);
            //isAnyOverlapping = _sprite.overlap(_list[i]);
            
            if(isAnyOverlapping)
                break;
        }
    }
    
    return isAnyOverlapping;
}