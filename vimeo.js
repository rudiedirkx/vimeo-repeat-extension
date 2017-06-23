
// Screenshot from	https://vimeo.com/35132562
// Or				http://www.dailymotion.com/video/x2dntv_back-to-life-back-to-reality_fun
// Or				https://www.youtube.com/watch?v=_Xmu-DOTChE

function onTimeUpdate(e) {
	var delta = Math.max(0.5, 0.5 * this.playbackRate);
	if ( this.currentTime >= this.duration - delta ) {
		this.currentTime = 0;
	}
}

function createXButton($box, onClick) {
	var $button = $box.querySelector('button');
	$button.onclick = onClick;

	$button.onmouseover = function() {
		with ( this.previousElementSibling.classList ) {
			remove('hidden');
			remove('invisible');
			add('visible');
		}
	};
	$button.onmouseout = function() {
		with ( this.previousElementSibling.classList ) {
			add('hidden');
			add('invisible');
			remove('visible');
		}
	};

	return $button;
}

function createRepeatButton(video) {
	var $box = document.createElement('div');
	$box.className = 'box';

	var html = '';
	html += '<style>';
	html += 'html .player .repeat-button { color: white; font-weight: bold; }\n';
	html += 'html .player .repeat-button.on { background-color: rgb(0, 173, 239); }\n';
	html += 'html .player .repeat-button.on:active { background-color: rgb(0, 147, 203); }\n';
	html += '</style>';
	html += '<label class="rounded-box repeat-label invisible hidden" role="presentation"><span>Repeat</span></label>';
	html += '<button title="Click to toggle." tabindex="50" class="repeat-button rounded-box" aria-label="Repeat">REP&#8203;EAT</button>';
	$box.innerHTML = html;

	var $button = createXButton($box, function(e) {
		var repeating = this.classList.toggle('on');
		if ( repeating ) {
			video.addEventListener('timeupdate', onTimeUpdate);
		}
		else {
			video.removeEventListener('timeupdate', onTimeUpdate);
		}
	});

	return $box;
}

function createSpeedButton(video) {
	var $box = document.createElement('div');
	$box.className = 'box';

	var html = '';
	html += '<style>';
	html += 'html .player .speed-button { color: white; font-weight: bold; } \n';
	html += 'html .player .speed-button.on { background-color: rgb(0, 173, 239); } \n';
	html += 'html .player .speed-button.on:active { background-color: rgb(0, 147, 203); } \n';
	html += '</style>';
	html += '<label class="rounded-box speed-label invisible hidden" role="presentation"><span>Playback rate</span></label>';
	html += '<button title="Mouse scroll to change speed. Click to enter custom speed." tabindex="50" class="speed-button rounded-box" aria-label="Speed">' + video.playbackRate + 'x</button>';
	$box.innerHTML = html;

	function setSpeed(speed) {
		video.playbackRate = speed;
		$button.textContent = (Math.round(speed * 100) / 100) + 'x';

		if ( video.playbackRate == 1 ) {
			$button.classList.remove('on');
		}
		else {
			$button.classList.add('on');
		}
	}

	var $button = createXButton($box, function(e) {
		var curSpeed = video.playbackRate,
			newSpeed = prompt('New playback rate:', curSpeed);
		if ( newSpeed != null && Number(newSpeed) == newSpeed && newSpeed != curSpeed ) {
			setSpeed(newSpeed);
		}
	});
	$button.onmousewheel = function(e) {
		var speeds = [0.2, 0.3333, 0.5, 0.6666, 1, 1.25, 1.5, 2, 2.5, 3, 4];

		e.preventDefault();

		var direction = e.wheelDelta / Math.abs(e.wheelDelta); // up = 1, down = -1
		var curSpeed = video.playbackRate,
			curSpeedIndex = speeds.indexOf(curSpeed);

		// On the scale, so find next by index
		if ( curSpeedIndex != -1 ) {
			if ( speeds[curSpeedIndex + direction] ) {
				setSpeed(speeds[curSpeedIndex + direction]);
			}
		}
		else {
			var candidates = speeds.filter(function(speed) {
				return direction > 0 ? (speed > curSpeed) : (speed < curSpeed);
			});
			if ( candidates.length ) {
				var newSpeed = direction > 0 ? candidates[0] : candidates[candidates.length-1];
				setSpeed(newSpeed);
			}
		}
	};

	return $box;
}



function tryToInitPlayer(attemptsLeft, $player, before) {
	var $buttons = $player.querySelector('.controls-wrapper .sidedock');
	var $video = $player.querySelector('video');

	if ( $player && $buttons && $video ) {
		before && before();

		// Only do once!
		if ( !$player.classList.contains('did-vimeo-repeat') ) {
			$player.classList.add('did-vimeo-repeat');

			// Add REPEAT button
			var $box = createRepeatButton($video);
			$buttons.appendChild($box);

			// Add SPEED button
			var $box = createSpeedButton($video);
			$buttons.appendChild($box);
		}
	}
	else {
		console.warn(
			"[Vimeo Repeat] Can't find player, buttons, or video. Trying " + attemptsLeft + " more times.",
			$player && 1 || 0,
			$buttons && 1 || 0,
			$video && 1 || 0
		);
		if ( attemptsLeft > 0 ) {
			setTimeout(function() {
				tryToInitPlayer(--attemptsLeft, $player, before);
			}, 50);
		}
	}
}



var $player = document.querySelector('div.player');
if ( $player ) {
	var mo = new MutationObserver(function(muts) {
		// Only do once!
		var disconnect = function() {
			mo.disconnect();
		};

		// Try to find buttons menu & video element
		tryToInitPlayer(2, $player, disconnect);
	});
	mo.observe($player, {"childList": 1})
}
