(function(window, document, undefined){
	var 	image = new Image(),
			div = document.getElementById("puzzle"),
			statusP,
			scale = 150,
			invScale = 1.0 / scale,
			ROWS = 3,
			COLS = 3,
			tiles = [],
			SPRITE_SHEET = "url('trump.jpg')",
			mouseX,
			mouseY,
			offsetX,
			offsetY,
			slidingTile
			interpolation = 0.8;
	
	/* Sprite
	 *
	 * A css Sprite:
	 * sheet is the sprite-sheet which this object will be using to render the
	 * sprite. So sheetX and sheetY is the top left hand corner of the area we're
	 * grabbing. dx and dy are used optionally to place the sprite off-center
	 */
	function Sprite(x, y, sheet, sheetX, sheetY, width, height, dx, dy){
		this.x = x;
		this.y = y;
		this.sheetX = sheetX;
		this.sheetY = sheetY;
		this.width = width;
		this.height = height;
		this.dx = dx || 0;
		this.dy = dy || 0;
		this.div = document.createElement("div");
		this.div.style.backgroundImage = sheet;
		this.div.style.backgroundPosition = (-sheetX) + "px " + (-sheetY) + "px";
		this.div.style.position = "absolute";
		this.div.style.width = width;
		this.div.style.height = height;
	}
	Sprite.prototype = {
		// updates the sprite position
		update: function(x, y){
			if(x) x = parseInt(x); else x = this.x;
			if(y) y = parseInt(y); else y = this.y;
			this.div.style.left = offsetX + this.dx + x;
			this.div.style.top = offsetY + this.dy + y;
		}
	}
	// calculates offset (needed to render relative to an element)
	function getOffset(element){
		offsetX = offsetY = 0;
		if(element.offsetParent){
			do{
				offsetX += element.offsetLeft;
				offsetY += element.offsetTop;
			} while ((element = element.offsetParent));
		}
	}
	/* Tile
	 *
	 * A tile in a sliding tile puzzle
	 */
	Tile.prototype = new Sprite();
	Tile.prototype.constructor = Tile;
	Tile.prototype.parent = Sprite.prototype;
	function Tile(r, c, sheet){
		Sprite.call(this, c * scale, r * scale, sheet, c * scale, r * scale, scale, scale);
		this.slideX = this.x;
		this.slideY = this.y;
		this.r = r;
		this.c = c;
	}
	// Moves a tile's position into an empty space on the map
	Tile.prototype.move = function(){
		// check for a destination
		var x = (this.x * invScale) >> 0;
		var y = (this.y * invScale) >> 0;
		if(x > 0 && !tiles[y][x -1]){
			swapTiles(x - 1, y, x, y);
		} else if(y > 0 && !tiles[y - 1][x]){
			swapTiles(x, y - 1, x, y);
		} else if(y < ROWS - 1 && !tiles[y + 1][x]){
			swapTiles(x, y + 1, x, y);
		} else if(x < COLS - 1 && !tiles[y][x + 1]){
			swapTiles(x + 1, y, x, y);
		}
	}
	
	// mouse listeners
	function mouseDown(e){
		var tile = tileAtMouse();
		if(tile && !slidingTile){
			tile.move();
			slidingTile = tile;
			setTimeout(slideTile, 50);
		}
		var c = complete();
		if(c == ROWS * COLS){
			statusP.innerHTML = "Great Success!";
		} else {
			var p = ((100 / (ROWS * COLS)) * c) >> 0;
			statusP.innerHTML = p + "% Complete";
		}
	}
	function mouseMove(e){
		mouseX = 0;
		mouseY = 0;
		e = e || window.event;
		if (e.pageX || e.pageY) 	{
			mouseX = e.pageX;
			mouseY = e.pageY;
		}
		else if (e.clientX || e.clientY) 	{
			mouseX = e.clientX + document.body.scrollLeft
				+ document.documentElement.scrollLeft;
			mouseY = e.clientY + document.body.scrollTop
				+ document.documentElement.scrollTop;
		}
	}
	
	// Called to prep the tiles
	function initTiles(){
		getOffset(div);
		var r, c;
		for(r = 0; r < ROWS; r++){
			tiles[r] = [];
			for(c = 0; c < COLS; c++){
				tiles[r][c] = new Tile(r, c, SPRITE_SHEET);
				tiles[r][c].update();
				div.appendChild(tiles[r][c].div);
			}
		}
		// make the top left corner empty
		div.removeChild(tiles[0][0].div);
		tiles[0][0] = undefined;
		randomiseTiles();
	}
	
	// Returns the tile under the mouse position
	function tileAtMouse(){
		var x = ((mouseX - offsetX) * invScale) >> 0;
		var y = ((mouseY - offsetY) * invScale) >> 0;
		if(x < 0 || y < 0 || x >= COLS || y >= ROWS){
			return undefined;
		}
		return tiles[y][x];
	}
	
	// Swaps the positions of two tiles in the tiles array. Does not move the
	// Sprite graphic so it can be animated moving
	function swapTiles(ax, ay, bx, by){
		if(ax == bx && ay == by) return;
		var temp = tiles[ay][ax];
		tiles[ay][ax] = tiles[by][bx];
		tiles[by][bx] = temp;
		if(tiles[ay][ax]){
			tiles[ay][ax].x = ax * scale;
			tiles[ay][ax].y = ay * scale;
		}
		if(tiles[by][bx]){
			tiles[by][bx].x = bx * scale;
			tiles[by][bx].y = by * scale;
		}
	}
	
	// Performs a sliding tile animation and locks out interaction till complete
	function slideTile(){
		var vx = slidingTile.x - slidingTile.slideX;
		var vy = slidingTile.y - slidingTile.slideY;
		slidingTile.slideX += vx * interpolation;
		slidingTile.slideY += vy * interpolation;
		var update = true;
		if(Math.abs(vx) < interpolation && Math.abs(vy) < interpolation){
			slidingTile.slideX = slidingTile.x;
			slidingTile.slideY = slidingTile.y;
			update = false;
		}
		slidingTile.update(slidingTile.slideX, slidingTile.slideY);
		if(update) setTimeout(slideTile, 50);
		else slidingTile = undefined;
	}
	
	// Returns the number of tiles that are in their home position
	function complete(){
		var r, c;
		var total = 0;
		for(r = 0; r < ROWS; r++){
			for(c = 0; c < COLS; c++){
				if(tiles[r][c] && tiles[r][c].r == r && tiles[r][c].c == c) total++;
				else if(r == 0 && c == 0) total++;
			}
		}
		return total
	}
	
	// Randomises the tile positions
	//
	// IMPORTANT: Before you optimise this, know that there are starting positions in a
	// 8 Puzzle that are impossible to solve. You must randomise within possible user
	// interactions only to be safe or write a solver for it
	function randomiseTiles(){
		var ax, ay, bx, by;
		while(complete() > 3){
			ax = bx = (Math.random() * COLS) >> 0;
			ay = by = (Math.random() * ROWS) >> 0;
			if(tiles[ay][ax]) continue;
			
			if(Math.random() < 0.5){
				bx += Math.random() < 0.5 ? 1 : -1;
			} else {
				by += Math.random() < 0.5 ? 1 : -1;
			}
			if(bx >= 0 && by >= 0 && bx < COLS && by < ROWS){
				swapTiles(ax, ay, bx, by);
			}
		}
		for(r = 0; r < ROWS; r++){
			for(c = 0; c < COLS; c++){
				if(tiles[r][c]){
					tiles[r][c].slideX = c * scale;
					tiles[r][c].slideY = r * scale;
					tiles[r][c].update();
				}
			}
		}
	}
	
	// Initialisation from this point in
	function init(){
		div.innerHTML = "";
		div.style.width = COLS * scale;
		div.style.height = ROWS * scale;
		initTiles();
		div.addEventListener("mousedown", mouseDown, false);
		div.addEventListener("mousemove", mouseMove, false);
		statusP = document.createElement("p");
		div.parentNode.appendChild(statusP);
		var p = ((100 / (ROWS * COLS)) * c) >> 0;
		statusP.innerHTML = p + "% Complete";
	}
	image.onload = init;
	image.src = "trump.jpg";
	
}(this, this.document))