
// Screenshot from	https://vimeo.com/35132562
// Or				http://www.dailymotion.com/video/x2dntv_back-to-life-back-to-reality_fun
// Or				https://www.youtube.com/watch?v=_Xmu-DOTChE

function loadConfig() {
	return new Promise(function(resolve) {
		if (chrome.storage) {
			chrome.storage.local.get(['config'], function(items) {
				resolve(items.config || {});
			});
		}
		else {
			resolve({});
		}
	});
}

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

	return [$box];
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

	const speeds = [0.2, 0.3333, 0.5, 0.6666, 1, 1.25, 1.5, 2, 2.5, 3, 4];

	function setLabel() {
		$button.textContent = (Math.round(video.playbackRate * 100) / 100) + 'x';
	}

	function setSpeed(speed) {
		video._rdxChangingSpeed = true;
		setTimeout(() => video._rdxChangingSpeed = false, 50);

		video.playbackRate = video._rdxLastSpeed = speed;

		if ( video.playbackRate == 1 ) {
			$button.classList.remove('on');
		}
		else {
			$button.classList.add('on');
		}

		// Fake trigger "events-moused-over"
		var $dock = document.querySelector('.vp-sidedock');
		$dock.classList.remove('hidden');
		$dock.classList.remove('invisible');
		$dock.hidden = false;
	}

	var $button = createXButton($box, function(e) {
		var curSpeed = video.playbackRate;
		var newSpeed = prompt('New playback rate:', curSpeed);
		if ( newSpeed === null ) return;

		newSpeed = parseFloat(newSpeed.replace(/,/g, '.'));
		if ( !isNaN(newSpeed) && newSpeed != curSpeed ) {
			setSpeed(newSpeed);
		}
	});
	$button.onwheel = function(e) {
		e.preventDefault();

		var direction = e.deltaY < 0 ? 1 : -1;
		deltaSpeed(direction);
	};

	video.addEventListener('ratechange', function(e) {
		setLabel();

		if (!this._rdxChangingSpeed) {
			console.warn('[Vimeo Repeat] Resetting changed speed to extension speed :|');
			setTimeout(() => setSpeed(this._rdxLastSpeed), 50);
		}
	});

	function deltaSpeed(direction) {
		var curSpeed = video.playbackRate;
		var curSpeedIndex = speeds.indexOf(curSpeed);

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
	}

	return [$box, setSpeed, deltaSpeed];
}



function tryToInitPlayer(attemptsLeft, $player) {
	var $buttons = $player.querySelector('.vp-controls-wrapper .vp-sidedock, .controls-wrapper .sidedock');
	var $video = $player.querySelector('video');

	if ( $player && $buttons && $video ) {
		// Only do once!
		if ( !$buttons.querySelector('.repeat-button') ) {
			console.debug('[Vimeo Repeat] Adding buttons');

			// Add REPEAT button
			const [$box1] = createRepeatButton($video);
			$buttons.appendChild($box1);

			// Add SPEED button
			const [$box2, setSpeed, deltaSpeed] = createSpeedButton($video);
			$buttons.appendChild($box2);

			document.addEventListener('keydown', function(e) {
				if ( !e.altKey && !e.ctrlKey ) {
					if ( e.code === 'Minus' ) {
						deltaSpeed(-1);
					}
					else if ( e.code === 'Equal' ) {
						deltaSpeed(+1);
					}
				}
			});

			loadConfig().then(config => {
				if ( config.defaultSpeed ) {
					setSpeed(config.defaultSpeed);
				}
			})
		}
	}
	else {
		console.debug(`[Vimeo Repeat] Can't find buttons (${$buttons ? 'Y' : 'N'}), or video (${$video ? 'Y' : 'N'}). Trying ${attemptsLeft} more times.`);
		if ( attemptsLeft > 0 ) {
			setTimeout(function() {
				tryToInitPlayer(--attemptsLeft, $player);
			}, 50);
		}
	}
}



var $player = document.querySelector('div.player');
if ( $player ) {
	var mo = new MutationObserver(function(muts) {
		// Try to find buttons menu & video element
		tryToInitPlayer(2, $player);
	});
	mo.observe($player, {"childList": true, "attributes": true});
}
