(function() {
var canvas, ctx, gameLoop, gameState, score, W=400, H=400;
var activeGame = '';
var cell=20;

var GAME_CONTROLS = {
    snake: '方向键操控 | 吃食物得分',
    breakout: '方向键/鼠标移动 | 弹球消除砖块',
    '2048': '方向键滑动 | 合并到2048',
    tetris: '方向键操控 | 消除整行得分'
};

function initCanvas() {
    var div = document.getElementById('games-canvas-wrap');
    if (!div) return;
    if (canvas) { canvas.remove(); }
    canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    canvas.style.borderRadius = '8px';
    canvas.style.background = '#111';
    canvas.style.border = '1px solid rgba(0,212,255,0.12)';
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    canvas.style.cursor = 'pointer';
    canvas.onmousedown = null;
    canvas.onclick = null;
    canvas.oncontextmenu = null;
    canvas.onmousemove = null;
    div.appendChild(canvas);
    ctx = canvas.getContext('2d');
}

function stopGame() {
    if (gameLoop) { cancelAnimationFrame(gameLoop); gameLoop = null; }
    gameState = null; score = 0;
}

function startGame(type) {
    stopGame(); activeGame = type;
    document.querySelectorAll('.game-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.game === type); });
    score = 0;
    document.getElementById('game-score').textContent = '0';
    document.getElementById('game-status').textContent = '';
    document.getElementById('game-leaderboard').innerHTML = '';
    document.getElementById('game-controls-tip').textContent = GAME_CONTROLS[type] || '';

    if (type === 'snake') initSnake();
    else if (type === 'breakout') initBreakout();
    else if (type === '2048') init2048();
    else if (type === 'tetris') initTetris();

    fetchLeaderboard(type);
}

function updateScore(pts) { score += pts; document.getElementById('game-score').textContent = score; }

function gameOver(type, win) {
    stopGame(); gameState = 'over';
    if (canvas) { canvas.onmousedown = null; canvas.onclick = null; canvas.oncontextmenu = null; }
    document.getElementById('game-status').textContent = (win ? '🎉 通关！' : '💀 结束！') + ' 得分：' + score;
    drawOverlay();
    if (score > 0) saveScore(type, score);
}

function drawOverlay() {
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign='center';
    ctx.fillText(gameState==='over' ? '游戏结束' : '恭喜通关', W/2, H/2-15);
    ctx.font = '16px sans-serif'; ctx.fillText('得分: '+score, W/2, H/2+20);
    ctx.textAlign='start';
}

async function saveScore(type, s) {
    try {
        await fetch('/api/games/'+type+'/score', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({token: (window.getToken ? window.getToken() : ''), score:s})
        });
    } catch(e) { console.error('Score save failed', e); }
    fetchLeaderboard(type);
}

async function fetchLeaderboard(type) {
    var el = document.getElementById('game-leaderboard');
    if (!el) return;
    try {
        var res = await fetch('/api/games/'+type+'/leaderboard');
        var data = await res.json();
        var h = '<h4 style="margin-top:0.5rem;margin-bottom:0.5rem;color:var(--accent);font-size:0.85rem">🏆 排行榜</h4>';
        if (!data.scores || !data.scores.length) h += '<div style="color:var(--text-secondary);font-size:0.8rem;padding:0.25rem">暂无记录</div>';
        else for (var i=0; i<data.scores.length; i++) {
            var m = {0:'🥇',1:'🥈',2:'🥉'}[i] || (i+1);
            h += '<div style="display:flex;gap:0.5rem;padding:0.2rem 0;font-size:0.8rem;border-bottom:1px solid rgba(255,255,255,0.04)"><span style="width:30px;text-align:center">'+m+'</span><span style="flex:1">'+data.scores[i].username+'</span><span style="color:var(--accent);font-weight:600">'+data.scores[i].score+'</span></div>';
        }
        el.innerHTML = h;
    } catch(e) {}
}

/* ===== SNAKE ===== */
var snake, food, snakeDir, snakeNext, snakeLast;
function initSnake() {
    var cols=Math.floor(400/cell), rows=Math.floor(400/cell);
    W=400; H=400; initCanvas();
    snake=[{x:5,y:5}]; snakeDir={x:1,y:0}; snakeNext={x:1,y:0};
    food=randFood(); snakeLast=0; gameState='playing';
    gameLoop=requestAnimationFrame(snakeLoop);
}
function randFood() {
    var f; do{f={x:Math.floor(Math.random()*(W/cell)),y:Math.floor(Math.random()*(H/cell))};} while(snake.some(function(s){return s.x===f.x&&s.y===f.y;}));
    return f;
}
function snakeLoop(ts){
    if(!gameLoop)return;
    if(!snakeLast)snakeLast=ts;
    if(ts-snakeLast<120){gameLoop=requestAnimationFrame(snakeLoop);return;}
    snakeLast=ts; snakeDir={x:snakeNext.x,y:snakeNext.y};
    var head={x:snake[0].x+snakeDir.x,y:snake[0].y+snakeDir.y};
    var mc=Math.floor(W/cell), mr=Math.floor(H/cell);
    if(head.x<0||head.x>=mc||head.y<0||head.y>=mr||snake.some(function(s){return s.x===head.x&&s.y===head.y;})){gameOver('snake');return;}
    snake.unshift(head);
    if(head.x===food.x&&head.y===food.y){updateScore(10);food=randFood();}else{snake.pop();}
    drawSnake(); gameLoop=requestAnimationFrame(snakeLoop);
}
function drawSnake(){
    ctx.fillStyle='#111';ctx.fillRect(0,0,W,H);
    var c=cell;
    ctx.fillStyle='#00d4ff';snake.forEach(function(s){ctx.fillRect(s.x*c+1,s.y*c+1,c-2,c-2);});
    ctx.fillStyle='#ff4444';ctx.fillRect(food.x*c+1,food.y*c+1,c-2,c-2);
}

/* ===== BREAKOUT ===== */
var paddle, ball, bricks, ballVel;
function initBreakout() {
    W=400; H=450; initCanvas();
    paddle={x:160,y:420,w:80,h:10};
    ball={x:200,y:380,r:6}; ballVel={x:3,y:-3};
    bricks=[]; for(var r=0;r<5;r++)for(var c=0;c<8;c++)bricks.push({x:c*50+4,y:r*25+30,w:42,h:18,alive:true});
    gameState='playing'; gameLoop=requestAnimationFrame(breakoutLoop);
}
function breakoutLoop(){
    if(!gameLoop)return;
    ball.x+=ballVel.x; ball.y+=ballVel.y;
    if(ball.x-ball.r<=0||ball.x+ball.r>=W)ballVel.x=-ballVel.x;
    if(ball.y-ball.r<=0)ballVel.y=-ballVel.y;
    if(ball.y+ball.r>=H){gameOver('breakout');return;}
    if(ball.y+ball.r>=paddle.y&&ball.y-ball.r<=paddle.y+paddle.h&&ball.x>=paddle.x&&ball.x<=paddle.x+paddle.w){
        ballVel.y=-ballVel.y; var hp=(ball.x-paddle.x)/paddle.w; ballVel.x=(hp-0.5)*8;
    }
    for(var i=0;i<bricks.length;i++){var b=bricks[i]; if(!b.alive)continue; if(ball.x+ball.r>b.x&&ball.x-ball.r<b.x+b.w&&ball.y+ball.r>b.y&&ball.y-ball.r<b.y+b.h){b.alive=false;ballVel.y=-ballVel.y;score+=10;}}
    document.getElementById('game-score').textContent=score;
    if(bricks.every(function(b){return!b.alive;})){gameOver('breakout',true);return;}
    drawBreakout(); gameLoop=requestAnimationFrame(breakoutLoop);
}
function drawBreakout(){
    ctx.fillStyle='#111';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#00d4ff';ctx.fillRect(paddle.x,paddle.y,paddle.w,paddle.h);
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);ctx.fill();
    var clrs=['#ff6b6b','#ff9f43','#feca57','#54a0ff','#5f27cd'];
    bricks.forEach(function(b,i){if(!b.alive)return;ctx.fillStyle=clrs[Math.floor(i/8)%clrs.length];ctx.fillRect(b.x,b.y,b.w,b.h);});
}

/* ===== 2048 ===== */
var g2048, g2048W=4, gCell=90;
function init2048(){
    W=g2048W*gCell+8; H=W; initCanvas();
    g2048=[]; for(var y=0;y<g2048W;y++){g2048[y]=[];for(var x=0;x<g2048W;x++)g2048[y][x]=0;}
    add2048(); add2048(); gameState='playing'; score=0;
    document.getElementById('game-score').textContent='0'; draw2048();
}
function add2048(){var e=[];for(var y=0;y<g2048W;y++)for(var x=0;x<g2048W;x++)if(g2048[y][x]===0)e.push({x:x,y:y});if(!e.length)return;var p=e[Math.floor(Math.random()*e.length)];g2048[p.y][p.x]=Math.random()<0.9?2:4;}
var c2048={0:'#2a2a3e',2:'#eee4da',4:'#ede0c8',8:'#f2b179',16:'#f59563',32:'#f67c5f',64:'#f65e3b',128:'#edcf72',256:'#edcc61',512:'#edc850',1024:'#edc53f',2048:'#edc22e'};
function draw2048(){
    ctx.fillStyle='#111';ctx.fillRect(0,0,W,H);
    for(var y=0;y<g2048W;y++)for(var x=0;x<g2048W;x++){var v=g2048[y][x],px=x*gCell+4,py=y*gCell+4;ctx.fillStyle=c2048[v]||'#3c3a32';ctx.fillRect(px,py,gCell-4,gCell-4);if(v>0){ctx.fillStyle=v>4?'#f9f6f2':'#776e65';ctx.font=v>512?'bold 28px sans-serif':'bold 34px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(v,px+gCell/2-2,py+gCell/2);ctx.textAlign='start';ctx.textBaseline='alphabetic';}}
}
function move2048(dir){
    if(gameState!=='playing')return;
    var old=JSON.parse(JSON.stringify(g2048));
    function line(a,r){var l=r?a.filter(function(v){return v;}).reverse():a.filter(function(v){return v;});for(var i=0;i<l.length-1;i++){if(l[i]===l[i+1]){l[i]*=2;score+=l[i];l.splice(i+1,1);}}while(l.length<g2048W)l.push(0);return r?l.reverse():l;}
    if(dir==='left'||dir==='right')for(var y=0;y<g2048W;y++)g2048[y]=line(g2048[y],dir==='right');
    if(dir==='up'||dir==='down')for(var x=0;x<g2048W;x++){var c=[];for(var y=0;y<g2048W;y++)c.push(g2048[y][x]);c=line(c,dir==='down');for(var y=0;y<g2048W;y++)g2048[y][x]=c[y];}
    if(!g2048.every(function(r,y){return r.every(function(v,x){return v===old[y][x];});})){
        add2048(); document.getElementById('game-score').textContent=score; draw2048();
        if(g2048.some(function(r){return r.indexOf(2048)!==-1;}))gameOver('2048',true);
        else{var can=false;for(var y=0;y<g2048W;y++)for(var x=0;x<g2048W-1;x++)if(g2048[y][x]===g2048[y][x+1])can=true;for(var y=0;y<g2048W-1;y++)for(var x=0;x<g2048W;x++)if(g2048[y][x]===g2048[y+1][x])can=true;if(!can)gameOver('2048');}
    }
}

/* ===== TETRIS ===== */
var tetBoard, tetPiece, tetTimer, tetSpeed;
var TET_SHAPES=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0],[1,0],[1,1]],[[0,1],[0,1],[1,1]],[[0,1],[1,1],[1,0]],[[1,0],[1,1],[0,1]]];
var TET_COLORS=['#0ff','#ff0','#a0f','#0f0','#f00','#f80','#00f'];
function initTetris(){
    cell=22; W=10*cell; H=20*cell; initCanvas();
    tetBoard=[];for(var y=0;y<20;y++){tetBoard[y]=new Array(10).fill(0);}
    score=0;tetSpeed=500;gameState='playing';updateScore(0);
    spawnTet();tetTimer=performance.now();gameLoop=requestAnimationFrame(tetLoop);
}
function spawnTet(){var i=Math.floor(Math.random()*TET_SHAPES.length);tetPiece={shape:TET_SHAPES[i],color:i,x:Math.floor((10-TET_SHAPES[i][0].length)/2),y:0};if(tetCollision(0,0)){gameOver('tetris');}}
function tetCollision(ox,oy){var s=tetPiece.shape;for(var y=0;y<s.length;y++)for(var x=0;x<s[y].length;x++){if(!s[y][x])continue;var nx=tetPiece.x+x+ox,ny=tetPiece.y+y+oy;if(nx<0||nx>=10||ny>=20)return true;if(ny>=0&&tetBoard[ny][nx])return true;}return false;}
function tetLoop(ts){if(!gameLoop||gameState!=='playing')return;if(ts-tetTimer>tetSpeed){tetTimer=ts;if(!tetCollision(0,1))tetPiece.y++;else lockTet();} drawTet(); gameLoop=requestAnimationFrame(tetLoop);}
function lockTet(){var s=tetPiece.shape,c=tetPiece.color+1;for(var y=0;y<s.length;y++)for(var x=0;x<s[y].length;x++)if(s[y][x]){var py=tetPiece.y+y,px=tetPiece.x+x;if(py<0){gameOver('tetris');return;}tetBoard[py][px]=c;}var cl=0;for(var y=19;y>=0;y--){if(tetBoard[y].every(function(v){return v;})){tetBoard.splice(y,1);tetBoard.unshift(new Array(10).fill(0));cl++;y++;}}var pts=[0,100,300,500,800];score+=pts[cl]||0;updateScore(0);if(cl>0&&tetSpeed>80)tetSpeed-=20;spawnTet();}
function drawTet(){ctx.fillStyle='#111';ctx.fillRect(0,0,W,H);for(var y=0;y<20;y++)for(var x=0;x<10;x++){if(tetBoard[y][x]){ctx.fillStyle=TET_COLORS[tetBoard[y][x]-1]||'#666';ctx.fillRect(x*cell+1,y*cell+1,cell-2,cell-2);}}if(tetPiece){var s=tetPiece.shape;ctx.fillStyle=TET_COLORS[tetPiece.color];for(var y=0;y<s.length;y++)for(var x=0;x<s[y].length;x++)if(s[y][x])ctx.fillRect((tetPiece.x+x)*cell+1,(tetPiece.y+y)*cell+1,cell-2,cell-2);}}

/* ===== KEYBOARD / MOUSE ===== */
document.addEventListener('keydown',function(e){
    if(!activeGame||gameState!=='playing')return;
    if(activeGame==='snake'){
        var k={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0}}[e.key];
        if(k&&(snakeDir.x!==-k.x||snakeDir.y!==-k.y))snakeNext=k; e.preventDefault();
    }else if(activeGame==='breakout'){
        if(e.key==='ArrowLeft')paddle.x=Math.max(0,paddle.x-20);
        if(e.key==='ArrowRight')paddle.x=Math.min(W-paddle.w,paddle.x+20); e.preventDefault();
    }else if(activeGame==='2048'){
        if(e.key==='ArrowUp')move2048('up');else if(e.key==='ArrowDown')move2048('down');
        else if(e.key==='ArrowLeft')move2048('left');else if(e.key==='ArrowRight')move2048('right'); e.preventDefault();
    }else if(activeGame==='tetris'){
        if(e.key==='ArrowLeft'&&!tetCollision(-1,0))tetPiece.x--;
        if(e.key==='ArrowRight'&&!tetCollision(1,0))tetPiece.x++;
        if(e.key==='ArrowDown'&&!tetCollision(0,1)){tetPiece.y++;tetTimer=performance.now();updateScore(1);}
        if(e.key==='ArrowUp'){var sh=tetPiece.shape,rot=sh[0].map(function(_,i){return sh.map(function(r){return r[i];}).reverse();});tetPiece.shape=rot;if(tetCollision(0,0))tetPiece.shape=sh;}
        if(e.key===' '){while(!tetCollision(0,1)){tetPiece.y++;score+=2;}updateScore(0);lockTet();tetTimer=performance.now();}
        e.preventDefault();
    }
});

document.addEventListener('mousemove', function(e){
    if(activeGame==='breakout'&&gameState==='playing'&&canvas&&paddle){
        var rect=canvas.getBoundingClientRect();
        paddle.x=Math.max(0, Math.min(W-paddle.w, e.clientX-rect.left-paddle.w/2));
    }
});

window.startGame = startGame;
window.stopGame = stopGame;
})();
